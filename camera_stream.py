"""Captura la A9 V720 y comparte el último frame JPEG con los clientes web."""
from __future__ import annotations

import importlib
import sys
import threading
import time
from pathlib import Path

from config import settings


class A9CameraStream:
    def __init__(self) -> None:
        self._condition = threading.Condition()
        self._frame: bytes | None = None
        self._sequence = 0
        self._state = "DETENIDA"
        self._detail = "La captura todavía no se ha iniciado."
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

    def status(self) -> dict[str, str | bool]:
        with self._condition:
            return {"connected": self._state == "TRANSMITIENDO", "state": self._state, "detail": self._detail}

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
            sys.path.insert(0, str(sdk_packages))

        try:
            cmd_udp = importlib.import_module("cmd_udp")
            netcl_tcp = importlib.import_module("netcl_tcp").netcl_tcp
            v720_ap = importlib.import_module("v720_ap").v720_ap
        except Exception as exc:
            self._set_state("ERROR", f"No se pudieron cargar las dependencias de la cámara: {exc}")
            return

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
