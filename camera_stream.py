"""Captura la A9 V720 y comparte el último frame JPEG con los clientes web."""
from __future__ import annotations

import importlib
import queue
import sys
import threading
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path

from config import settings


class A9CameraStream:
    def __init__(self) -> None:
        self._condition = threading.Condition()
        self._frame: bytes | None = None
        self._sequence = 0
        self._state = "DETENIDA"
        self._detail = "La captura todavía no se ha iniciado."
        self._ai_state = "PENDIENTE"
        self._ai_detail = "El detector todavía no se ha iniciado."
        self._people_count: int | None = None
        self._vehicle_count: int | None = None
        self._counts_updated_at: str | None = None
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._capture_loop, name="a9-camera", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        with self._condition:
            self._condition.notify_all()

    def status(self) -> dict[str, object]:
        with self._condition:
            return {
                "connected": self._state == "TRANSMITIENDO",
                "state": self._state,
                "detail": self._detail,
                "model_ready": self._ai_state == "ACTIVA",
                "model_state": self._ai_state,
                "model_detail": self._ai_detail,
                "people_count": self._people_count,
                "vehicle_count": self._vehicle_count,
                "updated_at": self._counts_updated_at,
            }

    def metrics(self) -> dict[str, object]:
        with self._condition:
            return {
                "connected": self._state == "TRANSMITIENDO",
                "model_ready": self._ai_state == "ACTIVA",
                "status": self._ai_detail if self._ai_state != "ACTIVA" else self._detail,
                "people_count": self._people_count,
                "vehicle_count": self._vehicle_count,
                "updated_at": self._counts_updated_at,
            }

    def _load_detector(self, sdk_root: Path):
        model_path = Path(settings.A9_DETECTION_MODEL_PATH).expanduser().resolve()
        if not model_path.is_file():
            raise FileNotFoundError(f"No se encontró el modelo de detección: {model_path}")
        import cv2
        import mediapipe as mp
        import numpy as np
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision

        options = vision.ObjectDetectorOptions(
            base_options=mp_python.BaseOptions(model_asset_path=str(model_path)),
            running_mode=vision.RunningMode.IMAGE,
            max_results=10,
            score_threshold=0.30,
        )
        detector = vision.ObjectDetector.create_from_options(options)
        return detector, cv2, np, mp

    def _analyze_frames(self, frame_queue, detector, cv2, np, mp) -> None:
        vehicle_history = deque(maxlen=8)
        people_history = deque(maxlen=8)
        while not self._stop.is_set():
            try:
                jpeg = frame_queue.get(timeout=0.5)
            except queue.Empty:
                continue
            try:
                frame = cv2.imdecode(np.frombuffer(jpeg, dtype=np.uint8), cv2.IMREAD_COLOR)
                if frame is None:
                    continue
                frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result = detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame))
                vehicles = 0
                people = 0
                for detection in result.detections:
                    if not detection.categories:
                        continue
                    label = (detection.categories[0].category_name or "").strip().upper()
                    if label == "CARRO":
                        vehicles += 1
                    elif label == "PEATON":
                        people += 1
                vehicle_history.append(vehicles)
                people_history.append(people)
                with self._condition:
                    self._vehicle_count = round(sum(vehicle_history) / len(vehicle_history))
                    self._people_count = round(sum(people_history) / len(people_history))
                    self._counts_updated_at = datetime.now(timezone.utc).isoformat()
                    self._condition.notify_all()
            except Exception as exc:
                with self._condition:
                    self._ai_state = "ERROR"
                    self._ai_detail = f"Falló el análisis de un frame: {exc}"
                    self._condition.notify_all()

    def wait_for_frame(self, after: int, timeout: float = 10.0) -> tuple[int, bytes] | None:
        deadline = time.monotonic() + timeout
        with self._condition:
            while self._sequence <= after and not self._stop.is_set():
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    return None
                self._condition.wait(remaining)
            if self._sequence <= after or self._frame is None:
                return None
            return self._sequence, self._frame

    def _set_state(self, state: str, detail: str) -> None:
        with self._condition:
            self._state, self._detail = state, detail
            if state != "TRANSMITIENDO":
                self._frame = None
            self._condition.notify_all()

    def _capture_loop(self) -> None:
        sdk_root = Path(settings.A9_CAMERA_SDK_PATH).expanduser().resolve()
        sdk_src = sdk_root / "a9-v720" / "src"
        if not sdk_src.is_dir():
            self._set_state("ERROR", f"No se encontró el SDK de la cámara en {sdk_src}")
            return

        if str(sdk_src) not in sys.path:
            sys.path.insert(0, str(sdk_src))
        # El SDK incluye xmltodict en su entorno virtual. Es código Python puro,
        # así que se puede reutilizar sin importar binarios de otro intérprete.
        sdk_packages = sdk_root / ".venv" / "Lib" / "site-packages"
        if sdk_packages.is_dir() and str(sdk_packages) not in sys.path:
            sys.path.append(str(sdk_packages))

        try:
            cmd_udp = importlib.import_module("cmd_udp")
            netcl_tcp = importlib.import_module("netcl_tcp").netcl_tcp
            v720_ap = importlib.import_module("v720_ap").v720_ap
        except Exception as exc:
            self._set_state("ERROR", f"No se pudieron cargar las dependencias de la cámara: {exc}")
            return

        detector = None
        frame_queue = queue.Queue(maxsize=1)
        try:
            detector, cv2, np, mp = self._load_detector(sdk_root)
            with self._condition:
                self._ai_state = "ACTIVA"
                self._ai_detail = "MediaPipe está analizando los frames de la cámara."
            threading.Thread(
                target=self._analyze_frames,
                args=(frame_queue, detector, cv2, np, mp),
                name="a9-object-detector",
                daemon=True,
            ).start()
        except Exception as exc:
            with self._condition:
                self._ai_state = "ERROR"
                self._ai_detail = f"No se pudo iniciar MediaPipe: {exc}"

        while not self._stop.is_set():
            try:
                self._set_state("CONECTANDO", f"Conectando con {settings.A9_CAMERA_HOST}:{settings.A9_CAMERA_PORT}…")
                with netcl_tcp(settings.A9_CAMERA_HOST, settings.A9_CAMERA_PORT) as sock:
                    camera = v720_ap(sock)
                    camera.init_live_motion()
                    self._set_state("CONECTANDO", "Cámara conectada; esperando el primer frame…")
                    frame_buffer = bytearray()
                    synchronized = False

                    def on_receive(command, data):
                        nonlocal synchronized
                        if command != cmd_udp.P2P_UDP_CMD_JPEG:
                            return
                        if not synchronized:
                            start = data.find(b"\xff\xd8")
                            if start < 0:
                                return
                            frame_buffer.extend(data[start:])
                            synchronized = True
                        else:
                            end = data.find(b"\xff\xd9")
                            if end < 0:
                                frame_buffer.extend(data)
                                return
                            frame_buffer.extend(data[:end + 2])
                            jpeg = bytes(frame_buffer)
                            frame_buffer.clear()
                            synchronized = False
                            if detector is not None:
                                try:
                                    frame_queue.put_nowait(jpeg)
                                except queue.Full:
                                    try:
                                        frame_queue.get_nowait()
                                    except queue.Empty:
                                        pass
                                    try:
                                        frame_queue.put_nowait(jpeg)
                                    except queue.Full:
                                        pass
                            with self._condition:
                                # El navegador rota el JPEG en un canvas; el servidor no requiere OpenCV.
                                self._frame = jpeg
                                self._sequence += 1
                                self._state = "TRANSMITIENDO"
                                self._detail = "Se están recibiendo frames de la A9 V720."
                                self._condition.notify_all()

                    camera.cap_live(on_receive)
                if not self._stop.is_set():
                    self._set_state("DESCONECTADA", "La cámara cerró la conexión; intentando reconectar…")
            except Exception as exc:
                if not self._stop.is_set():
                    self._set_state("DESCONECTADA", f"No se pudo recibir video: {exc}")
            self._stop.wait(3)


camera_stream = A9CameraStream()
