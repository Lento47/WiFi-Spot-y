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
    const [useOpenAI, setUseOpenAI] = useState(true); // Toggle between OpenAI and local AI
    const messagesEndRef = useRef(null);
    const chatbotFormRef = useRef(null);
    
    // Initialize AI service
    const aiService = new AIService();

    // AI Knowledge Base for WiFi Hub (fallback when OpenAI is not available)
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

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Get API status on component mount
    useEffect(() => {
        const status = aiService.getAPIStatus();

        setApiStatus(status);
    }, []);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isTyping) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        try {
            // Get AI response
            const aiResponse = await getAIResponse(inputMessage);
            
            const aiMessage = {
                id: Date.now() + 1,
                text: aiResponse,
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
            
            // Save to chat history
            setChatHistory(prev => [...prev, userMessage, aiMessage]);
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            
            const errorMessage = {
                id: Date.now() + 1,
                text: 'Lo siento, tuve un problema procesando tu mensaje. Por favor, intenta de nuevo.',
                sender: 'ai',
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    // Get AI response using OpenAI or fallback to local knowledge base
    const getAIResponse = async (userInput) => {
        const input = userInput.toLowerCase();
        
        // Try OpenAI first if enabled and available
        if (useOpenAI && apiStatus.openai?.status === 'active') {
            try {

                const aiResponse = await aiService.getAIResponse(userInput);

                return aiResponse;
            } catch (error) {
                console.error('OpenAI error, falling back to local AI:', error);
                // Fall back to local AI
            }
        }
        
        // Fallback to local knowledge base
        for (const [category, data] of Object.entries(aiKnowledgeBase)) {
            for (const pattern of data.patterns) {
                if (input.includes(pattern)) {
                    const responses = data.responses;
                    return responses[Math.floor(Math.random() * responses.length)];
                }
            }
        }
        
        // Default response if no pattern matches
        return 'Gracias por tu mensaje. Soy tu asistente AI de WiFi Hub. ¿Puedo ayudarte con información sobre nuestros servicios, pagos, soporte técnico o cualquier otra consulta?';
    };

    // Execute actions
    const executeAction = async (action, data = {}) => {
        switch (action) {
            case 'navigate_to_payments':
                // Navigate to payments section
                return 'Te he llevado a la sección de compra de créditos. Allí podrás seleccionar tu paquete y realizar el pago.';
            
            case 'show_help':
                // Show help information
                return 'Aquí tienes información de ayuda:\n\n• **Conexión WiFi**: Busca la red "WiFi-Hub" e ingresa tu contraseña\n• **Pagos**: Ve a "Comprar Créditos" y usa SINPE Móvil\n• **Soporte**: Crea un ticket en la sección de Soporte\n• **Referencias**: Comparte tu código para ganar créditos bonus';
            
            case 'post_to_bulletin':
                // Handle bulletin post
                if (data.content && data.type) {
                    return `✅ Mensaje publicado en el mural comunitario:\n\n**Tipo:** ${data.type}\n**Contenido:** ${data.content}\n\nTu mensaje será visible para toda la comunidad.`;
                }
                return 'Por favor, completa el formulario para publicar en el mural.';
            
            default:
                return 'Acción no reconocida. ¿En qué puedo ayudarte?';
        }
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
                className="fixed bottom-4 right-4 z-[9998] w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Abrir Chatbot AI"
            >
                <FiMessageCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" />
            </motion.button>

            {/* Chatbot Interface */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className={`fixed bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 z-[9999] flex flex-col ${
                            isMinimized ? 'w-16 h-16 sm:w-20 sm:h-20 hover:shadow-blue-500/30 hover:border-blue-400/50' : 'w-[calc(100vw-32px)] max-w-md h-[calc(100vh-32px)] max-h-[600px]'
                        }`}
                        style={{
                            right: '16px',
                            bottom: '16px',
                            zIndex: 9999,
                            maxWidth: isMinimized ? '80px' : '450px',
                            minHeight: isMinimized ? '64px' : '400px'
                        }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 rounded-t-2xl flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <RiRobot2Line className="w-5 h-5 sm:w-6 sm:h-6" />
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold">WiFi Hub AI</h3>
                                    <p className="text-xs text-blue-100">Asistente Virtual</p>
                                    {/* AI Status Indicator */}
                                    <div className="flex items-center gap-1 mt-1">
                                        {useOpenAI && apiStatus.openai?.status === 'active' ? (
                                            <span className="text-xs bg-green-500/20 text-green-200 px-2 py-1 rounded-full">
                                                OpenAI ✓
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full">
                                                Local AI
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* AI Toggle Button */}
                                <button
                                    onClick={() => setUseOpenAI(!useOpenAI)}
                                    className="p-1 hover:bg-white/20 rounded transition-colors text-xs"
                                    title={useOpenAI ? 'Cambiar a Local AI' : 'Cambiar a OpenAI'}
                                >
                                    {useOpenAI ? '🤖' : '🧠'}
                                </button>
                                <button
                                                                            onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-1 hover:bg-white/20 rounded transition-colors"
                                    title={isMinimized ? 'Maximizar' : 'Minimizar'}
                                >
                                    {isMinimized ? <FiMaximize2 className="w-4 h-4" /> : <FiMinimize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-white/20 rounded transition-colors"
                                    title="Cerrar"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {isMinimized ? (
                            // Minimized state - just show icon and tooltip
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <RiRobot2Line className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                    <p className="text-xs text-blue-600 font-medium">AI</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                                    {messages.length === 0 ? (
                                        <div className="text-center py-6 sm:py-8">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                                <RiRobot2Line className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
                                            </div>
                                            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                                ¡Hola! Soy tu asistente AI
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                                                ¿En qué puedo ayudarte hoy? Puedo ayudarte con:
                                            </p>
                                            
                                            {/* Quick Actions */}
                                            <div className="space-y-2 sm:space-y-3">
                                                <motion.button
                                                    onClick={() => setShowTicketPanel(true)}
                                                    className="w-full p-3 sm:p-4 text-sm sm:text-base bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 font-semibold flex items-center justify-center gap-2 sm:gap-3 shadow-lg"
                                                    whileHover={{ scale: 1.02, y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <FiEdit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    🎫 Crear Ticket de Soporte
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => showActionFormModal('post_to_bulletin')}
                                                    className="w-full p-2 sm:p-3 text-xs sm:text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    📢 Publicar en Mural Comunitario
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => executeAction('navigate_to_payments')}
                                                    className="w-full p-2 sm:p-3 text-xs sm:text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium"
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
                                                        className={`max-w-[85%] p-3 sm:p-4 rounded-2xl break-words ${
                                                            message.sender === 'user'
                                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                                        }`}
                                                    >
                                                        <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.text}</div>
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
                                                    <div className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 p-3 sm:p-4 rounded-2xl">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex space-x-1">
                                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                            </div>
                                                            <span className="text-xs sm:text-sm">
                                                                {useOpenAI && apiStatus.openai?.status === 'active' ? 'OpenAI escribiendo...' : 'AI escribiendo...'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-600">
                                    <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
                                        <input
                                            ref={chatbotFormRef}
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder="Escribe tu mensaje..."
                                            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={isTyping}
                                        />
                                        <motion.button
                                            type="submit"
                                            disabled={!inputMessage.trim() || isTyping}
                                            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </motion.button>
                                    </form>
                                </div>
                            </>
                        )}

                        {/* Action Form Modal */}
                        {showActionForm && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200">
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
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIChatbot;
