const API_KEY = "AIzaSyANAcMeFPcZcYvYf44YHQ6jdkfE0jWfFLw"; 
        
        const MODEL = "gemini-2.5-flash-preview-09-2025"; //MODELO UTILIZADO DE LA API
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
        
        let chatHistory = []; //MANTENER EL HISTORIAL DE LA CONVERSACIÓN

        // CONTEXTO CLAVE PARA GEMINI (System Instruction)
        const SYSTEM_INSTRUCTION_TEXT = `
            Eres el Asistente Virtual de Biokuam, un proyecto social enfocado en ayudar a los campesinos del municipio de Simijaca, Colombia, para el cultivo de maíz. 
            Tu rol es responder preguntas sobre agricultura, manejo de cultivos de maíz, y análisis de la calidad del agua (pH y temperatura) basado en los parámetros ideales.
            
            Información clave:
            - **Cultivo:** Maíz.
            - **Ubicación:** Simijaca, Colombia.
            - **Parámetros óptimos para Maíz:** pH ideal entre 6.0 y 7.5. Temperatura del agua óptima entre 20°C y 30°C.
            - **Tono:** Sé amigable, alentador, y proporciona respuestas claras y prácticas, usando un lenguaje sencillo adecuado para un agricultor.
            
            Cuando se te pida evaluar el agua, usa los parámetros óptimos. Si el usuario no proporciona datos, pídeles que te den los valores de pH y temperatura.
            Tus respuestas deben ser concisas y enfocadas en la solución para el campesino.
        `;        
        const chatBox = document.getElementById('biokuamChatBox');
        const userInput = document.getElementById('biokuamUserInput');
        const sendBtn = document.getElementById('biokuamSendBtn');

        /**
         * AGREGAR MENSAJE AL CUADRO DE TEXTO (CHAT)
         * @param {string} text CONTENIDO DEL MENSAJE
         * @param {string} sender REMITENTE DEL MENSAJE ('user' o 'ai')
         * @returns {HTMLElement} ELEMENTO DEL MENSAJE AÑADIDO 
         */
        function appendMessage(text, sender) {
            const msgElement = document.createElement('div');
            msgElement.classList.add(sender === 'user' ? 'biokuam-msg-user' : 'biokuam-msg-ai');
            // Usamos innerHTML para permitir saltos de línea y formateo de la respuesta de la IA
            msgElement.innerHTML = sender === 'ai' ? text.replace(/\n/g, '<br>') : text;
            chatBox.appendChild(msgElement);
            // Desplazar al fondo para mostrar el mensaje más reciente
            chatBox.scrollTop = chatBox.scrollHeight;
            return msgElement;
        }
        // MANEJADOR PRINCIPAL PARA ENVIAR EL MENSAJE A GEMINI
        async function handleSendMessage() {
            const userText = userInput.value.trim();
            if (!userText) return;

            // Limpiar input y deshabilitar controles
            userInput.value = '';
            sendBtn.disabled = true;
            userInput.disabled = true;

            // Mostrar mensaje del usuario y agregarlo al historial
            appendMessage(userText, 'user');
            chatHistory.push({ role: "user", parts: [{ text: userText }] });

            // Agregar indicador de "escribiendo..."
            const typingIndicator = appendMessage('...', 'ai');
            typingIndicator.classList.add('typing-indicator');

            try {
                // Construir el payload de la API. El PAYLOAD INCLUYE EL HISTORIAL COMPLETO y significa que la IA tiene contexto de toda la conversación.
                const payload = {
                    contents: chatHistory,
                    systemInstruction: {
                        parts: [{ text: SYSTEM_INSTRUCTION_TEXT }]
                    },
                    // Usamos tools: [{ "google_search": {} }] para grounding si necesitamos datos externos
                    // tools: [{ "google_search": {} }] 
                };

                // Llamar a la API de Gemini (con reintentos por backoff exponencial)
                const response = await fetchWithExponentialBackoff(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();

                // Procesar la respuesta
                const candidate = result.candidates?.[0];

                if (candidate && candidate.content?.parts?.[0]?.text) {
                    const aiText = candidate.content.parts[0].text;
                    
                    // Mostrar el mensaje de la IA
                    typingIndicator.remove();
                    appendMessage(aiText, 'ai');
                    
                    // Agregar la respuesta de la IA al historial
                    chatHistory.push({ role: "model", parts: [{ text: aiText }] });

                } else {
                    typingIndicator.remove();
                    appendMessage('Lo siento, hubo un problema con la respuesta de la IA. Por favor, inténtalo de nuevo.', 'ai');
                    // Opcional: Eliminar la última entrada del usuario del historial si falló la respuesta
                    chatHistory.pop(); 
                }

            } catch (error) {
                console.error("Error al comunicarse con la API de Gemini:", error);
                typingIndicator.remove();
                appendMessage('¡Ups! Tuvimos un error de conexión con el asistente. Revisa la consola o tu clave API.', 'ai');
                chatHistory.pop(); // Eliminar la entrada del usuario si falla
            } finally {
                // Habilitar controles
                sendBtn.disabled = false;
                userInput.disabled = false;
                userInput.focus();
            }
        }
        
        // Función para realizar fetch con backoff exponencial.
        async function fetchWithExponentialBackoff(url, options, maxRetries = 5) {
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const response = await fetch(url, options);
                    if (response.ok) {
                        return response;
                    }
                    // Throw error to trigger retry logic for non-200 responses
                    throw new Error(`HTTP error! status: ${response.status}`);
                } catch (error) {
                    if (attempt === maxRetries - 1) {
                        console.error("Máximo de reintentos alcanzado. Fallo definitivo.", error);
                        throw error;
                    }
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    // Retardo silencioso (no se loguea como error en la consola, solo en desarrollo si se desea)
                    await new Promise(resolve => setTimeout(resolve, delay)); 
                }
            }
        }

        // -------------------------------------------------------------
        // Event Listeners (Controladores de Eventos)
        // -------------------------------------------------------------

        // Al hacer clic en el botón 'Enviar'
        sendBtn.addEventListener('click', handleSendMessage);

        // Al presionar 'Enter' en el área de texto (si no se presiona Shift)
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Previene el salto de línea por defecto
                handleSendMessage();
            }
        });
        
        // Enfocar el input al cargar la página para facilitar el uso
        window.onload = () => {
             userInput.focus();
        };