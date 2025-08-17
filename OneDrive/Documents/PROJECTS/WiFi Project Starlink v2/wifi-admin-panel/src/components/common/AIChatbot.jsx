import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiUser, FiMinimize2, FiMaximize2, FiEdit3 } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import AIService from '../../services/ai-service.js';
import TicketPanel from './TicketPanel.jsx';
import { useAuth } from '../../hooks/useAuth';

const AIChatbot = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [apiStatus, setApiStatus] = useState({});
    const [showActionForm, setShowActionForm] = useState(false);
    const [currentAction, setCurrentAction] = useState(null);
    const [actionFormData, setActionFormData] = useState({});
    const [showTicketPanel, setShowTicketPanel] = useState(false);
    const [chatbotContext, setChatbotContext] = useState({});
    const messagesEndRef = useRef(null);
    const chatbotFormRef = useRef(null);
    
    // Initialize AI service
    const aiService = new AIService();

    // AI Knowledge Base for WiFi Hub
    const aiKnowledgeBase = {
        greetings: {
            patterns: ['hola', 'hello', 'hi', 'buenos días', 'buenas', 'hey'],
            responses: [
                '¡Hola! Soy tu asistente virtual de WiFi Hub. ¿En qué puedo ayudarte hoy?',
                '¡Hola! Bienvenido a WiFi Hub. ¿Tienes alguna pregunta sobre nuestros servicios?',
                '¡Hola! Soy tu asistente AI. ¿Necesitas ayuda con WiFi Hub?'
            ]
        },
        wifi_connection: {
            patterns: ['conexión', 'wifi', 'internet', 'conectar', 'señal', 'velocidad', 'conectarse', 'red'],
            responses: [
                'Para conectarte a WiFi Hub:\n1. Asegúrate de estar en el área de cobertura\n2. Busca la red "WiFi-Hub"\n3. Ingresa tu contraseña\n4. ¡Disfruta de internet de alta velocidad!',
                'Si tienes problemas de conexión:\n• Verifica que tu dispositivo esté actualizado\n• Reinicia tu router si es necesario\n• Contacta soporte si persiste el problema',
                'La velocidad de WiFi Hub depende de tu paquete:\n• Básico: Hasta 50 Mbps\n• Premium: Hasta 100 Mbps\n• Ultra: Hasta 200 Mbps',
                'Consejos para mejor conexión:\n• Mantén tu dispositivo cerca del router\n• Evita interferencias de otros dispositivos\n• Actualiza los drivers de tu WiFi',
                'Nuestra red WiFi-Hub usa tecnología de última generación para ofrecerte la mejor experiencia de internet en la comunidad.'
            ]
        },
        payments: {
            patterns: ['pago', 'pagar', 'factura', 'cobro', 'precio', 'paquete', 'créditos', 'comprar', 'sinpe'],
            responses: [
                'Nuestros paquetes WiFi:\n• 1 Hora: ₡500\n• 4 Horas: ₡1,800\n• 1 Día: ₡3,500\n• 1 Semana: ₡15,000\n• 1 Mes: ₡45,000',
                'Para realizar pagos:\n1. Ve a "Comprar Créditos"\n2. Selecciona tu paquete\n3. Completa el pago SINPE\n4. Espera aprobación del admin',
                'Los pagos se procesan en 24-48 horas. Recibirás notificación cuando se aprueben y se agreguen los créditos a tu cuenta.',
                'Métodos de pago aceptados:\n• SINPE Móvil (recomendado)\n• Transferencia bancaria\n• Efectivo en la administración',
                'Beneficios de nuestros paquetes:\n• Sin contratos a largo plazo\n• Flexibilidad total\n• Sin cargos ocultos\n• Soporte técnico incluido'
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

    // AI Response Generator with Action Detection
    const generateAIResponse = (userMessage) => {
        const message = userMessage.toLowerCase();
        let response = '';
        let category = 'general';
        let action = null;

        // Check for action requests first
        if (message.includes('crear ticket') || message.includes('crear soporte') || message.includes('nuevo ticket')) {
            action = 'create_support_ticket';
            category = 'support';
        } else if (message.includes('postear') || message.includes('publicar') || message.includes('mural') || message.includes('comunidad')) {
            action = 'post_to_bulletin';
            category = 'bulletin';
        } else if (message.includes('comprar') || message.includes('pagar') || message.includes('paquete')) {
            action = 'navigate_to_payments';
            category = 'payments';
        } else if (message.includes('referencia') || message.includes('referido') || message.includes('código')) {
            action = 'navigate_to_referrals';
            category = 'referral';
        }

        // Find matching category if no action detected
        if (!action) {
            for (const [key, data] of Object.entries(aiKnowledgeBase)) {
                if (data.patterns.some(pattern => message.includes(pattern))) {
                    category = key;
                    break;
                }
            }
        }

        // Get random response from category
        const responses = aiKnowledgeBase[category].responses;
        response = responses[Math.floor(Math.random() * responses.length)];

        // Add action-specific responses and buttons
        if (action === 'create_support_ticket') {
            response = 'Perfecto, te ayudo a crear un ticket de soporte. Necesito algunos detalles:\n\n' +
                      '📝 **Título del problema:** (describe brevemente)\n' +
                      '🔍 **Descripción:** (explica en detalle)\n' +
                      '🚨 **Prioridad:** Baja/Media/Alta/Crítica\n' +
                      '📱 **Categoría:** Conexión/Pago/Referencia/Otro\n\n' +
                      '¿Puedes proporcionarme esta información?';
        } else if (action === 'post_to_bulletin') {
            response = '¡Excelente idea! Te ayudo a publicar en el mural comunitario.\n\n' +
                      '📢 **Tipo de mensaje:** Anuncio/Consulta/Evento/Compartir\n' +
                      '📝 **Contenido:** (qué quieres compartir)\n' +
                      '🏷️ **Etiquetas:** (opcional, para categorizar)\n\n' +
                      '¿Qué te gustaría publicar?';
        } else if (action === 'navigate_to_payments') {
            response = 'Te redirijo a la sección de pagos donde podrás:\n\n' +
                      '💳 Ver todos los paquetes disponibles\n' +
                      '💰 Comparar precios y duraciones\n' +
                      '🔄 Realizar pagos SINPE\n' +
                      '📊 Ver historial de transacciones\n\n' +
                      '¿Te gustaría que te ayude a elegir un paquete?';
        } else if (action === 'navigate_to_referrals') {
            response = 'Te llevo al programa de referencias donde podrás:\n\n' +
                      '🎁 Ver tu código único\n' +
                      '👥 Invitar amigos y familiares\n' +
                      '⏰ Ganar créditos por referidos\n' +
                      '📈 Ver tu historial de referencias\n\n' +
                      '¿Quieres que te explique cómo funciona?';
        }

        // Add contextual follow-up questions and variety
        const followUps = {
            greetings: [
                '\n\n¿Te gustaría saber más sobre algún servicio específico?',
                '\n\n¿Tienes alguna pregunta sobre WiFi Hub?',
                '\n\n¿En qué puedo ayudarte hoy?'
            ],
            wifi_connection: [
                '\n\n¿Has intentado reiniciar tu dispositivo?',
                '\n\n¿En qué área de la comunidad estás ubicado?',
                '\n\n¿Qué tipo de dispositivo estás usando?'
            ],
            payments: [
                '\n\n¿Te interesa algún paquete en particular?',
                '\n\n¿Has tenido problemas con algún pago anterior?',
                '\n\n¿Necesitas ayuda con el proceso SINPE?'
            ],
            referral: [
                '\n\n¿Ya tienes tu código de referencia?',
                '\n\n¿Has invitado a alguien recientemente?',
                '\n\n¿Te gustaría que te explique cómo compartir tu código?'
            ],
            support: [
                '\n\n¿Has creado un ticket de soporte antes?',
                '\n\n¿Cuál es la prioridad de tu problema?',
                '\n\n¿Necesitas ayuda para crear el ticket?'
            ],
            troubleshooting: [
                '\n\n¿Cuánto tiempo lleva ocurriendo este problema?',
                '\n\n¿Has notado si ocurre en momentos específicos?',
                '\n\n¿Puedes describir exactamente qué está pasando?'
            ]
        };

        // Add random follow-up question if no action
        if (!action && followUps[category]) {
            const randomFollowUp = followUps[category][Math.floor(Math.random() * followUps[category].length)];
            response += randomFollowUp;
        }

        // Add action buttons if action detected
        if (action) {
            response += '\n\n🔧 **Acciones disponibles:**';
            if (action === 'create_support_ticket') {
                response += '\n• Crear ticket ahora\n• Ver tickets existentes\n• Contactar soporte directo';
            } else if (action === 'post_to_bulletin') {
                response += '\n• Publicar mensaje\n• Ver mural actual\n• Buscar mensajes';
            }
        }

        // Add some personality
        response += '\n\n🤖 Estoy aquí para ayudarte. ¿Hay algo más específico que te gustaría saber?';

        return response;
    };

    // Handle message submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');
        
        // Add user message
        const newUserMessage = {
            id: Date.now(),
            text: userMessage,
            sender: 'user',
            timestamp: new Date()
        };
        
        // Update chatbot context for ticket panel
        setChatbotContext({
            lastMessage: userMessage,
            conversationHistory: messages,
            userProfile: 'WiFi Hub User'
        });
        
        setMessages(prev => [...prev, newUserMessage]);
        setIsTyping(true);

        try {
            // First, check if we should use local AI for action detection
            const localResponse = generateAIResponse(userMessage);
            
            // If local response contains action buttons, use it
            if (localResponse.includes('🔧 **Acciones disponibles:**')) {
                const newAIMessage = {
                    id: Date.now() + 1,
                    text: localResponse,
                    sender: 'ai',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, newAIMessage]);
            } else {
                // Try to get AI response using the service
                try {
                    console.log('Attempting to call AI service...');
                    const aiResponse = await aiService.getAIResponse(userMessage);
                    console.log('AI service response:', aiResponse);
                    
                    const newAIMessage = {
                        id: Date.now() + 1,
                        text: aiResponse,
                        sender: 'ai',
                        timestamp: new Date()
                    };
                    
                    setMessages(prev => [...prev, newAIMessage]);
                } catch (aiError) {
                    console.error('AI service error:', aiError);
                    
                    // Fallback to local response
                    const newAIMessage = {
                        id: Date.now() + 1,
                        text: localResponse,
                        sender: 'ai',
                        timestamp: new Date()
                    };
                    
                    setMessages(prev => [...prev, newAIMessage]);
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
            
            // Fallback response on error
            const fallbackResponse = {
                id: Date.now() + 1,
                text: 'Lo siento, estoy teniendo problemas para procesar tu pregunta. Por favor, intenta de nuevo o contacta al soporte técnico.',
                sender: 'ai',
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, fallbackResponse]);
        } finally {
            setIsTyping(false);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Get API status on component mount
    useEffect(() => {
        const status = aiService.getAPIStatus();
        console.log('AI Service Status:', status);
        setApiStatus(status);
    }, []);

    // Welcome message on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage = {
                id: Date.now(),
                text: '¡Hola! Soy tu asistente virtual de WiFi Hub 🤖\n\n¿En qué puedo ayudarte hoy?\n\nPuedo asistirte con:\n• 📶 Conexión WiFi y problemas técnicos\n• 💳 Información de paquetes y pagos\n• 🎁 Programa de referencias\n• 🆘 Soporte y tickets\n• ⚙️ Configuración de cuenta\n\n¡Solo escribe tu pregunta!',
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, messages.length]);

    // Quick action buttons
    const quickActions = [
        { text: '📶 Problemas de conexión', action: 'Tengo problemas para conectarme al WiFi' },
        { text: '💳 Información de pagos', action: '¿Cuáles son los precios de los paquetes?' },
        { text: '🎁 Programa de referencias', action: '¿Cómo funciona el programa de referencias?' },
        { text: '🆘 Crear ticket de soporte', action: 'Necesito crear un ticket de soporte' }
    ];

    const handleQuickAction = (action) => {
        setInputMessage(action);
        // Auto-submit after a short delay
        setTimeout(() => {
            // Use the ref to submit the chatbot's own form
            if (chatbotFormRef.current) {
                chatbotFormRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        }, 100);
    };

    // Action execution functions
    const executeAction = async (action, data = {}) => {
        try {
            switch (action) {
                case 'create_support_ticket':
                    return await createSupportTicket(data);
                case 'post_to_bulletin':
                    return await postToBulletin(data);
                case 'navigate_to_payments':
                    return navigateToTab('buy');
                case 'navigate_to_referrals':
                    return navigateToTab('referrals');
                default:
                    return 'Acción no reconocida';
            }
        } catch (error) {
            console.error('Error executing action:', error);
            return 'Error ejecutando la acción. Por favor, intenta de nuevo.';
        }
    };

    // Create support ticket
    const createSupportTicket = async (data) => {
        // This would integrate with your existing Support component
        // For now, we'll simulate the action
        const ticketData = {
            title: data.title || 'Ticket creado via chatbot',
            description: data.description || 'Ticket generado automáticamente',
            priority: data.priority || 'Media',
            category: data.category || 'Otro',
            createdAt: new Date(),
            status: 'open'
        };

        // Add success message
        const successMessage = {
            id: Date.now(),
            text: `✅ **Ticket de soporte creado exitosamente!**\n\n` +
                  `📝 Título: ${ticketData.title}\n` +
                  `🚨 Prioridad: ${ticketData.priority}\n` +
                  `📱 Categoría: ${ticketData.category}\n` +
                  `⏰ Estado: Abierto\n\n` +
                  `Nuestro equipo de soporte te contactará en las próximas 24-48 horas.`,
            sender: 'ai',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, successMessage]);
        return 'Ticket creado exitosamente';
    };

    // Post to bulletin board
    const postToBulletin = async (data) => {
        // This would integrate with your existing BulletinBoard component
        // For now, we'll simulate the action
        const postData = {
            type: data.type || 'Anuncio',
            content: data.content || 'Mensaje publicado via chatbot',
            tags: data.tags || ['chatbot'],
            createdAt: new Date(),
            author: 'Usuario via Chatbot'
        };

        // Add success message
        const successMessage = {
            id: Date.now(),
            text: `✅ **Mensaje publicado en el mural comunitario!**\n\n` +
                  `📢 Tipo: ${postData.type}\n` +
                  `📝 Contenido: ${postData.content}\n` +
                  `🏷️ Etiquetas: ${postData.tags.join(', ')}\n` +
                  `⏰ Publicado: ${postData.createdAt.toLocaleString()}\n\n` +
                  `Tu mensaje ya está visible para toda la comunidad.`,
            sender: 'ai',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, successMessage]);
        return 'Mensaje publicado exitosamente';
    };

    // Navigate to specific tab (this would need to be passed from parent)
    const navigateToTab = (tabName) => {
        // This function would need to be passed from the parent UserPage component
        // For now, we'll just show a message
        const navigationMessage = {
            id: Date.now(),
            text: `🔄 **Navegando a ${tabName}...**\n\n` +
                  `Te estoy llevando a la sección correspondiente. ` +
                  `Si no se abre automáticamente, haz clic en la pestaña "${tabName}" en el menú superior.`,
            sender: 'ai',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, navigationMessage]);
        return `Navegando a ${tabName}`;
    };

    // Show action form modal
    const showActionFormModal = (action) => {
        if (action === 'create_support_ticket') {
            // Open the independent ticket panel instead
            setShowTicketPanel(true);
        } else {
            setCurrentAction(action);
            setActionFormData({});
            setShowActionForm(true);
        }
    };

    // Handle action form submission
    const handleActionFormSubmit = async (e, action) => {
        e.preventDefault();
        
        try {
            // Execute the action with form data
            const result = await executeAction(action, actionFormData);
            
            // Close the form
            setShowActionForm(false);
            setActionFormData({});
            
            // Add success message to chat
            const successMessage = {
                id: Date.now(),
                text: `✅ **Acción completada exitosamente!**\n\n${result}`,
                sender: 'ai',
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, successMessage]);
            
        } catch (error) {
            console.error('Error submitting action form:', error);
            
            // Add error message to chat
            const errorMessage = {
                id: Date.now(),
                text: `❌ **Error ejecutando la acción:**\n\n${error.message || 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'}`,
                sender: 'ai',
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    // Handle ticket creation from panel
    const handleTicketCreated = (ticketData) => {
        // Add success message to chat
        const successMessage = {
            id: Date.now(),
            text: `✅ **Ticket de soporte creado exitosamente!**\n\n` +
                  `🎫 **ID:** ${ticketData.id}\n` +
                  `📝 **Título:** ${ticketData.title}\n` +
                  `🚨 **Prioridad:** ${ticketData.priority}\n` +
                  `📱 **Categoría:** ${ticketData.category}\n` +
                  `⏰ **Estado:** Abierto\n` +
                  `👤 **Asignado a:** ${ticketData.assignedTo}\n\n` +
                  `Nuestro equipo de soporte te contactará en las próximas 24-48 horas. ` +
                  `Puedes hacer seguimiento de tu ticket en la sección de Soporte.`,
            sender: 'ai',
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, successMessage]);
        
        // Close the ticket panel
        setShowTicketPanel(false);
    };

    return (
        <>
            {/* Chatbot Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <FiMessageCircle className="w-8 h-8 mx-auto" />
            </motion.button>

            {/* Chatbot Interface */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className={`fixed bottom-4 right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 z-50 ${
                            isMinimized ? 'w-20 h-20 hover:shadow-blue-500/30 hover:border-blue-400/50' : 'w-full max-w-md h-[600px]'
                        }`}
                        style={{
                            maxWidth: isMinimized ? '80px' : '450px',
                            minHeight: isMinimized ? '80px' : '600px'
                        }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <RiRobot2Line className="w-6 h-6" />
                                                                    <div>
                                    <h3 className="font-semibold">WiFi Hub AI</h3>
                                    <p className="text-sm text-blue-100">Asistente Virtual</p>
                                    {/* Debug State */}
                                    <div className="text-xs text-blue-200 mt-1">
                                        State: {isMinimized ? 'Minimized' : 'Maximized'}
                                    </div>
                                    {/* API Status Indicator */}
                                    <div className="flex items-center gap-2 mt-1">
                                        {apiStatus.openai?.status === 'active' && (
                                            <span className="text-xs bg-green-500/20 text-green-200 px-2 py-1 rounded-full">
                                                OpenAI ✓
                                            </span>
                                        )}
                                        {apiStatus.gemini?.status === 'active' && (
                                            <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full">
                                                Gemini ✓
                                            </span>
                                        )}
                                        {(!apiStatus.openai?.status || apiStatus.openai?.status !== 'active') && 
                                         (!apiStatus.gemini?.status || apiStatus.gemini?.status !== 'active') && (
                                            <span className="text-xs bg-yellow-500/20 text-yellow-200 px-2 py-1 rounded-full">
                                                Local AI
                                            </span>
                                        )}
                                    </div>
                                </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            console.log('Minimize button clicked, current state:', isMinimized);
                                            setIsMinimized(!isMinimized);
                                            console.log('New state will be:', !isMinimized);
                                        }}
                                        className="p-1 hover:bg-white/20 rounded transition-colors"
                                    >
                                        {isMinimized ? <FiMaximize2 className="w-4 h-4" /> : <FiMinimize2 className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-white/20 rounded transition-colors"
                                    >
                                        <FiX className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {isMinimized === false ? (
                            <>
                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(600px - 200px)' }}>
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <RiRobot2Line className="w-8 h-8 text-green-600 dark:text-green-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                                ¡Hola! Soy tu asistente AI
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                                ¿En qué puedo ayudarte hoy? Puedo ayudarte con:
                                            </p>
                                            
                                            {/* Quick Actions */}
                                            <div className="space-y-3">
                                                <motion.button
                                                    onClick={() => setShowTicketPanel(true)}
                                                    className="w-full p-4 text-base bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 font-semibold flex items-center justify-center gap-3 shadow-lg"
                                                    whileHover={{ scale: 1.02, y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <FiEdit3 className="w-5 h-5" />
                                                    🎫 Crear Ticket de Soporte
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => showActionFormModal('post_to_bulletin')}
                                                    className="w-full p-3 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    📢 Publicar en Mural Comunitario
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => executeAction('navigate_to_payments')}
                                                    className="w-full p-3 text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    💳 Ir a Comprar Créditos
                                                </motion.button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[80%] p-4 rounded-2xl ${
                                                            message.sender === 'user'
                                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                                        }`}
                                                    >
                                                        <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                                                        <div className={`text-xs mt-2 ${
                                                            message.sender === 'user' ? 'text-green-100' : 'text-slate-500 dark:text-slate-400'
                                                        }`}>
                                                            {message.timestamp.toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {isTyping && (
                                                <div className="flex justify-start">
                                                    <div className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 p-4 rounded-2xl">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex space-x-1">
                                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                            </div>
                                                            <span className="text-sm">AI escribiendo...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Quick Actions */}
                                <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-600">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                        <FiEdit3 className="w-4 h-4" />
                                        Acciones Rápidas
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <motion.button
                                            onClick={() => setShowTicketPanel(true)}
                                            className="p-3 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            🎫 Crear Ticket de Soporte
                                        </motion.button>
                                        <motion.button
                                            onClick={() => showActionFormModal('post_to_bulletin')}
                                            className="p-3 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            📢 Publicar en Mural
                                        </motion.button>
                                        <motion.button
                                            onClick={() => executeAction('navigate_to_payments')}
                                            className="p-3 text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            💳 Comprar Créditos
                                        </motion.button>
                                        <motion.button
                                            onClick={() => executeAction('navigate_to_referrals')}
                                            className="p-3 text-sm bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-medium"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            🎁 Programa de Referencias
                                        </motion.button>
                                    </div>
                                    
                                    {/* Direct Ticket Creation Button */}
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                                        <motion.button
                                            onClick={() => setShowTicketPanel(true)}
                                            className="w-full p-4 text-base bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 font-semibold flex items-center justify-center gap-3 shadow-lg"
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <FiEdit3 className="w-5 h-5" />
                                            🎫 Crear Ticket Directamente
                                        </motion.button>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                                            Acceso rápido al formulario completo
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons - Show when AI suggests actions */}
                                {messages.length > 1 && messages.some(msg => 
                                    msg.sender === 'ai' && msg.text.includes('🔧 **Acciones disponibles:**')
                                ) && (
                                    <div className="px-4 pb-3">
                                        <div className="space-y-2">
                                            <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                                                💡 Haz clic en una acción para ejecutarla:
                                            </p>
                                            <div className="grid grid-cols-1 gap-2">
                                                <motion.button
                                                    onClick={() => showActionFormModal('create_support_ticket')}
                                                    className="p-3 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    🎫 Crear Ticket de Soporte
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => showActionFormModal('post_to_bulletin')}
                                                    className="p-3 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    📢 Publicar en Mural Comunitario
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => executeAction('navigate_to_payments')}
                                                    className="p-3 text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    💳 Ir a Comprar Créditos
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => executeAction('navigate_to_referrals')}
                                                    className="p-3 text-sm bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-medium"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    🎁 Ir a Programa de Referencias
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Form Modal */}
                                {showActionForm && (
                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
                                        >
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                                    📢 Publicar en Mural
                                                </h3>
                                                <button
                                                    onClick={() => setShowActionForm(false)}
                                                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <form onSubmit={(e) => handleActionFormSubmit(e, 'post_to_bulletin')} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                        Tipo de mensaje *
                                                    </label>
                                                    <select
                                                        required
                                                        value={actionFormData.type || ''}
                                                        onChange={(e) => setActionFormData({...actionFormData, type: e.target.value})}
                                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Selecciona tipo</option>
                                                        <option value="Anuncio">Anuncio</option>
                                                        <option value="Consulta">Consulta</option>
                                                        <option value="Evento">Evento</option>
                                                        <option value="Compartir">Compartir</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                        Contenido *
                                                    </label>
                                                    <textarea
                                                        required
                                                        rows={4}
                                                        value={actionFormData.content || ''}
                                                        onChange={(e) => setActionFormData({...actionFormData, content: e.target.value})}
                                                        className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                                                        placeholder="Escribe tu mensaje para la comunidad..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                        Etiquetas (opcional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={actionFormData.tags || ''}
                                                        onChange={(e) => setActionFormData({...actionFormData, tags: e.target.value})}
                                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                                        placeholder="Ej: wifi, comunidad, evento"
                                                    />
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowActionForm(false)}
                                                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        Publicar
                                                    </button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    </div>
                                )}

                                {/* Independent Ticket Panel */}
                                <TicketPanel
                                    isOpen={showTicketPanel}
                                    onClose={() => setShowTicketPanel(false)}
                                    chatbotContext={chatbotContext}
                                    onTicketCreated={handleTicketCreated}
                                    user={user}
                                />

                                {/* Input Area */}
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                    <form onSubmit={handleSubmit} className="flex gap-3">
                                        <div className="flex-1 relative">
                                            <input
                                                ref={chatbotFormRef}
                                                type="text"
                                                value={inputMessage}
                                                onChange={(e) => setInputMessage(e.target.value)}
                                                placeholder="Escribe tu mensaje o pregunta..."
                                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                                                style={{ minHeight: '48px' }}
                                            />
                                        </div>
                                        <motion.button
                                            type="submit"
                                            disabled={!inputMessage.trim() || isTyping}
                                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 shadow-lg"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <FiSend className="w-4 h-4" />
                                        </motion.button>
                                    </form>
                                    
                                    {/* Quick Ticket Creation */}
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                                        <motion.button
                                            onClick={() => setShowTicketPanel(true)}
                                            className="w-full p-3 text-sm bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-md"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <FiEdit3 className="w-4 h-4" />
                                            🎫 Crear Ticket de Soporte
                                        </motion.button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Minimized State - Just show icon and title */
                            <motion.div 
                                className="flex flex-col items-center justify-center h-full p-2 cursor-pointer"
                                onClick={() => {
                                    console.log('Minimized area clicked, maximizing...');
                                    setIsMinimized(false);
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Click para maximizar el chatbot"
                            >
                                <div className="text-center mb-2">
                                    <RiRobot2Line className="w-8 h-8 text-white mx-auto mb-1" />
                                    <p className="text-xs text-blue-100">WiFi Hub AI</p>
                                </div>
                                
                                {/* Large Maximize Button */}
                                <motion.button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent double-triggering
                                        console.log('Maximize button clicked from minimized state');
                                        setIsMinimized(false);
                                    }}
                                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Maximizar chatbot"
                                >
                                    <FiMaximize2 className="w-5 h-5 text-white" />
                                </motion.button>
                                
                                {/* Click anywhere to maximize hint */}
                                <p className="text-xs text-blue-200 mt-2 text-center opacity-80">
                                    Click para expandir
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIChatbot;
