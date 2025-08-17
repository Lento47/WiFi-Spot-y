import AI_CONFIG from '../config/ai-config.js';

class AIService {
    constructor() {
        this.config = AI_CONFIG;
        this.conversationHistory = [];
    }

    // Add message to conversation history
    addToHistory(role, content) {
        this.conversationHistory.push({ role, content });
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
    }

    // Get conversation context for API calls
    getConversationContext() {
        const systemMessage = {
            role: 'system',
            content: this.config.personality.context
        };
        return [systemMessage, ...this.conversationHistory];
    }

    // Call OpenAI API
    async callOpenAI(userMessage) {
        try {
            if (!this.config.openai.apiKey || !this.config.openai.enabled) {
                throw new Error('OpenAI API not configured or disabled');
            }

            this.addToHistory('user', userMessage);

            const requestBody = {
                model: this.config.openai.model,
                messages: this.getConversationContext(),
                max_tokens: this.config.openai.maxTokens,
                temperature: this.config.openai.temperature
            };

            console.log('OpenAI API Request:', {
                model: this.config.openai.model,
                hasApiKey: !!this.config.openai.apiKey,
                apiKeyLength: this.config.openai.apiKey?.length || 0,
                messagesCount: requestBody.messages.length,
                maxTokens: this.config.openai.maxTokens
            });

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.openai.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('OpenAI API response:', response.status, errorData);
                throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            this.addToHistory('assistant', aiResponse);
            return aiResponse;

        } catch (error) {
            console.error('OpenAI API error:', error);
            throw error;
        }
    }

    // Call Google Gemini API
    async callGemini(userMessage) {
        try {
            if (!this.config.gemini.apiKey || !this.config.gemini.enabled) {
                throw new Error('Gemini API not configured or disabled');
            }

            this.addToHistory('user', userMessage);

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.gemini.model}:generateContent?key=${this.config.gemini.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: this.buildGeminiPrompt(userMessage)
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: this.config.gemini.maxTokens,
                        temperature: this.config.gemini.temperature
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            this.addToHistory('assistant', aiResponse);
            return aiResponse;

        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }

    // Build prompt for Gemini API
    buildGeminiPrompt(userMessage) {
        const context = this.config.personality.context;
        const history = this.conversationHistory
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');
        
        return `${context}\n\nHistorial de conversación:\n${history}\n\nUsuario: ${userMessage}\n\nAsistente:`;
    }

    // Get AI response using configured API
    async getAIResponse(userMessage) {
        try {
            // Try OpenAI first if enabled
            if (this.config.openai.enabled && this.config.openai.apiKey) {
                return await this.callOpenAI(userMessage);
            }
            
            // Try Gemini if enabled
            if (this.config.gemini.enabled && this.config.gemini.apiKey) {
                return await this.callGemini(userMessage);
            }
            
            // Fallback to local responses
            if (this.config.fallback.enabled) {
                return this.getLocalResponse(userMessage);
            }
            
            throw new Error('No AI service configured');
            
        } catch (error) {
            console.error('AI service error:', error);
            // Always fallback to local responses on error
            return this.getLocalResponse(userMessage);
        }
    }

    // Local fallback responses
    getLocalResponse(userMessage) {
        const message = userMessage.toLowerCase();
        let response = '';
        let category = 'general';

        // Find matching category
        for (const [key, data] of Object.entries(this.localKnowledgeBase)) {
            if (data.patterns.some(pattern => message.includes(pattern))) {
                category = key;
                break;
            }
        }

        // Get random response from category
        const responses = this.localKnowledgeBase[category].responses;
        response = responses[Math.floor(Math.random() * responses.length)];

        // Add some personality and context
        if (category === 'greetings') {
            response += '\n\nPuedo ayudarte con:\n• Conexión WiFi y problemas técnicos\n• Información de paquetes y pagos\n• Programa de referencias\n• Soporte y tickets\n• Configuración de cuenta';
        }

        return response;
    }

    // Local knowledge base (fallback)
    localKnowledgeBase = {
        greetings: {
            patterns: ['hola', 'hello', 'hi', 'buenos días', 'buenas', 'hey'],
            responses: [
                '¡Hola! Soy tu asistente virtual de WiFi Hub. ¿En qué puedo ayudarte hoy?',
                '¡Hola! Bienvenido a WiFi Hub. ¿Tienes alguna pregunta sobre nuestros servicios?',
                '¡Hola! Soy tu asistente AI. ¿Necesitas ayuda con WiFi Hub?'
            ]
        },
        wifi_connection: {
            patterns: ['conexión', 'wifi', 'internet', 'conectar', 'señal', 'velocidad'],
            responses: [
                'Para conectarte a WiFi Hub:\n1. Asegúrate de estar en el área de cobertura\n2. Busca la red "WiFi-Hub"\n3. Ingresa tu contraseña\n4. ¡Disfruta de internet de alta velocidad!',
                'Si tienes problemas de conexión:\n• Verifica que tu dispositivo esté actualizado\n• Reinicia tu router si es necesario\n• Contacta soporte si persiste el problema',
                'La velocidad de WiFi Hub depende de tu paquete:\n• Básico: Hasta 50 Mbps\n• Premium: Hasta 100 Mbps\n• Ultra: Hasta 200 Mbps'
            ]
        },
        payments: {
            patterns: ['pago', 'pagar', 'factura', 'cobro', 'precio', 'paquete', 'créditos'],
            responses: [
                'Nuestros paquetes WiFi:\n• 1 Hora: ₡500\n• 4 Horas: ₡1,800\n• 1 Día: ₡3,500\n• 1 Semana: ₡15,000\n• 1 Mes: ₡45,000',
                'Para realizar pagos:\n1. Ve a "Comprar Créditos"\n2. Selecciona tu paquete\n3. Completa el pago SINPE\n4. Espera aprobación del admin',
                'Los pagos se procesan en 24-48 horas. Recibirás notificación cuando se aprueben y se agreguen los créditos a tu cuenta.'
            ]
        },
        referral: {
            patterns: ['referencia', 'referido', 'código', 'invitar', 'amigo', 'bonificación'],
            responses: [
                '¡Programa de Referencias WiFi Hub!\n• Comparte tu código único\n• Gana 60 minutos por cada referido exitoso\n• Sin límite de referidos\n• Los créditos se agregan automáticamente',
                'Para usar un código de referencia:\n1. Al registrarte, ingresa el código\n2. Recibirás 60 minutos bonus\n3. El referente también gana 60 minutos\n4. ¡Ambos se benefician!',
                'Tu código de referencia se genera automáticamente. Compártelo en redes sociales para ganar más créditos.'
            ]
        },
        support: {
            patterns: ['ayuda', 'soporte', 'problema', 'error', 'falla', 'ticket'],
            responses: [
                'Para obtener soporte:\n1. Ve a la pestaña "Soporte"\n2. Crea un ticket con tu problema\n3. Selecciona categoría y prioridad\n4. Nuestro equipo te responderá en 24-48 horas',
                'Problemas comunes:\n• Conexión lenta: Verifica tu paquete y ubicación\n• Sin señal: Reinicia tu dispositivo\n• Error de pago: Verifica datos SINPE',
                'Para emergencias técnicas, contacta directamente al administrador. Los tickets de soporte son la mejor opción para la mayoría de consultas.'
            ]
        },
        account: {
            patterns: ['cuenta', 'perfil', 'usuario', 'configuración', 'datos', 'información'],
            responses: [
                'Para gestionar tu cuenta:\n1. Accede a tu portal de usuario\n2. Ve a "Mi Perfil"\n3. Actualiza información personal\n4. Cambia contraseña si es necesario',
                'Tu perfil incluye:\n• Información personal\n• Historial de pagos\n• Créditos disponibles\n• Código de referencia\n• Configuración de notificaciones',
                'Para cambiar tu nombre de usuario, contacta al administrador. Los datos de contacto se pueden actualizar desde tu perfil.'
            ]
        },
        troubleshooting: {
            patterns: ['no funciona', 'problema', 'error', 'falla', 'lento', 'cortado'],
            responses: [
                'Pasos de solución de problemas:\n1. Reinicia tu dispositivo\n2. Verifica la conexión WiFi\n3. Comprueba tu paquete activo\n4. Limpia caché del navegador\n5. Contacta soporte si persiste',
                'Problemas de velocidad:\n• Verifica tu paquete contratado\n• Cierra aplicaciones innecesarias\n• Evita usar durante horas pico\n• Contacta soporte para diagnóstico',
                'Si el problema persiste después de estos pasos, crea un ticket de soporte con detalles específicos para que podamos ayudarte mejor.'
            ]
        },
        general: {
            patterns: ['qué', 'cómo', 'cuándo', 'dónde', 'por qué', 'cuál'],
            responses: [
                'WiFi Hub es tu proveedor de internet de alta velocidad con tecnología Starlink. Ofrecemos conexión rápida, confiable y asequible para toda la comunidad.',
                'Nuestros servicios incluyen:\n• Conexión WiFi de alta velocidad\n• Paquetes flexibles por tiempo\n• Programa de referencias\n• Soporte técnico 24/7\n• Aplicación móvil',
                'Para más información, visita nuestra página de ayuda o contacta al equipo de soporte. Estamos aquí para ayudarte a disfrutar de la mejor experiencia de internet.'
            ]
        }
    };

    // Get API status
    getAPIStatus() {
        return {
            openai: {
                enabled: this.config.openai.enabled,
                hasKey: !!this.config.openai.apiKey,
                status: this.config.openai.enabled && this.config.openai.apiKey ? 'active' : 'inactive'
            },
            gemini: {
                enabled: this.config.gemini.enabled,
                hasKey: !!this.config.gemini.apiKey,
                status: this.config.gemini.enabled && this.config.gemini.apiKey ? 'active' : 'inactive'
            },
            fallback: {
                enabled: this.config.fallback.enabled,
                status: 'active'
            }
        };
    }

    // Clear conversation history
    clearHistory() {
        this.conversationHistory = [];
    }
}

export default AIService;
