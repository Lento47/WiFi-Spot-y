// AI Configuration for WiFi Hub Chatbot
export const AI_CONFIG = {
    // OpenAI Configuration
    openai: {
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        model: 'gpt-4o-mini', // Fixed: gpt-5-nano doesn't exist
        maxTokens: 500,
        temperature: 0.7,
        enabled: true  // Set to true to enable OpenAI
    },
    
    // Google Gemini Configuration
    gemini: {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        model: 'gemini-pro',
        maxTokens: 500,
        temperature: 0.7,
        enabled: false // Set to true to enable Gemini
    },
    
    // Fallback to local AI responses if no API is configured
    fallback: {
        enabled: true,
        responseDelay: 1000 // Delay in milliseconds to simulate AI thinking
    },
    
    // Chatbot personality and context
    personality: {
        name: 'WiFi Hub AI',
        role: 'Asistente virtual especializado en servicios WiFi y soporte técnico',
        language: 'Spanish',
        tone: 'Amigable y profesional',
        context: `
            Eres un asistente virtual especializado en WiFi Hub, un proveedor de servicios WiFi con tecnología Starlink.
            Tu objetivo es ayudar a usuarios con:
            - Conexión WiFi y problemas técnicos
            - Información sobre paquetes y pagos
            - Programa de referencias
            - Sistema de soporte y tickets
            - Configuración de cuenta
            
            Siempre responde en español de manera clara, útil y amigable.
            Si no sabes algo, sugiere contactar al soporte técnico.
        `
    }
};

// Environment variables setup instructions
export const SETUP_INSTRUCTIONS = `
Para configurar las APIs de IA:

1. Crea un archivo .env en la raíz del proyecto
2. Agrega una de estas variables:

Para OpenAI:
VITE_OPENAI_API_KEY=tu_api_key_aqui

Para Gemini:
VITE_GEMINI_API_KEY=tu_api_key_aqui

3. Reinicia la aplicación
4. Cambia 'enabled: true' en la configuración correspondiente
`;

export default AI_CONFIG;
