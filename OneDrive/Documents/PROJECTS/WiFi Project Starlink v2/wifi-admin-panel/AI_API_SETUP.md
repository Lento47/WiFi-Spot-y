# 🚀 Configuración de APIs de IA para WiFi Hub Chatbot

## 📋 Requisitos Previos

- Cuenta en OpenAI (para GPT) o Google AI Studio (para Gemini)
- API Key válida
- Proyecto WiFi Hub funcionando

## 🔑 Configuración de OpenAI (GPT)

### 1. Obtener API Key
1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Inicia sesión o crea una cuenta
3. Haz clic en "Create new secret key"
4. Copia la API key generada

### 2. Configurar en el Proyecto
1. Crea un archivo `.env` en la raíz del proyecto
2. Agrega esta línea:
   ```
       VITE_OPENAI_API_KEY=tu_api_key_aqui
   ```
3. Ve a `src/config/ai-config.js`
4. Cambia `enabled: false` a `enabled: true` en la sección OpenAI
5. Reinicia el servidor de desarrollo

### 3. Costos
- GPT-3.5-turbo: ~$0.002 por 1K tokens
- Respuesta típica: 100-300 tokens
- Costo por conversación: ~$0.001

## 🌟 Configuración de Google Gemini

### 1. Obtener API Key
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia la API key generada

### 2. Configurar en el Proyecto
1. En el archivo `.env`, agrega:
   ```
       VITE_GEMINI_API_KEY=tu_api_key_aqui
   ```
2. Ve a `src/config/ai-config.js`
3. Cambia `enabled: false` a `enabled: true` en la sección Gemini
4. Reinicia el servidor de desarrollo

### 3. Costos
- Gemini Pro: Gratis hasta 15M tokens/mes
- Respuesta típica: 100-300 tokens
- Costo por conversación: Gratis (dentro del límite)

## ⚙️ Configuración del Sistema

### Archivo de Configuración
Edita `src/config/ai-config.js`:

```javascript
export const AI_CONFIG = {
    openai: {
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.7,
        enabled: true // Cambiar a true para habilitar
    },
    
    gemini: {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        model: 'gemini-pro',
        maxTokens: 500,
        temperature: 0.7,
        enabled: false // Cambiar a true para habilitar
    }
};
```

### Variables de Entorno
Crea un archivo `.env` en la raíz:

```env
# OpenAI
VITE_OPENAI_API_KEY=sk-...

# Gemini
VITE_GEMINI_API_KEY=AIza...

# Nota: Las variables deben empezar con VITE_
```

## 🔄 Reinicio del Sistema

Después de configurar las APIs:

1. **Detén el servidor** de desarrollo (Ctrl+C)
2. **Elimina la caché** de Vite:
   ```bash
   rm -rf node_modules/.vite
   ```
3. **Reinicia el servidor**:
   ```bash
   npm run dev
   ```

## ✅ Verificación

### Indicadores Visuales
- **Verde (OpenAI ✓)**: API OpenAI activa
- **Azul (Gemini ✓)**: API Gemini activa
- **Amarillo (Local AI)**: Usando respuestas locales

### Prueba de Funcionamiento
1. Abre el chatbot
2. Haz una pregunta compleja
3. Verifica que la respuesta sea más inteligente que las locales
4. Revisa la consola del navegador para logs de API

## 🛠️ Solución de Problemas

### Error: "API not configured"
- Verifica que el archivo `.env` esté en la raíz
- Asegúrate de que las variables empiecen con `VITE_`
- Reinicia el servidor después de cambios

### Error: "API key invalid"
- Verifica que la API key sea correcta
- Asegúrate de que la cuenta tenga créditos (OpenAI)
- Verifica que la API esté habilitada en el dashboard

### Error: "Rate limit exceeded"
- Espera unos minutos antes de hacer más preguntas
- Considera aumentar el límite en tu cuenta
- Usa respuestas locales como respaldo

### Error: "Network error"
- Verifica tu conexión a internet
- Asegúrate de que no haya firewall bloqueando las APIs
- Revisa la consola del navegador para más detalles

## 🔒 Seguridad

### Protección de API Keys
- **NUNCA** subas el archivo `.env` a Git
- Agrega `.env` a tu `.gitignore`
- Usa variables de entorno en producción
- Rota las API keys regularmente

### Límites de Uso
- Configura límites de rate en tu cuenta
- Monitorea el uso de tokens
- Establece alertas de costos (OpenAI)

## 📊 Monitoreo

### Métricas a Seguir
- Número de preguntas por día
- Tiempo de respuesta promedio
- Tasa de éxito de las APIs
- Costos mensuales (si aplica)

### Logs de Sistema
- Revisa la consola del navegador
- Monitorea las respuestas de error
- Verifica el estado de las APIs

## 🚀 Optimización

### Configuración de Modelos
- **OpenAI**: Usa `gpt-3.5-turbo` para mejor relación costo/rendimiento
- **Gemini**: Usa `gemini-pro` para respuestas más inteligentes

### Ajustes de Parámetros
- **Temperature**: 0.7 para respuestas balanceadas, 0.3 para más precisas
- **Max Tokens**: 500 para respuestas concisas, 1000 para más detalladas

### Respuestas Locales
- Mantén el sistema de respuestas locales como respaldo
- Mejora las respuestas locales basándote en el feedback de usuarios
- Usa respuestas locales para preguntas muy comunes

## 📞 Soporte

### Recursos Adicionales
- [Documentación de OpenAI](https://platform.openai.com/docs)
- [Documentación de Gemini](https://ai.google.dev/docs)
- [Soporte de WiFi Hub](mailto:soporte@wifi-hub.cr)

### Contacto
Si tienes problemas con la configuración:
1. Revisa esta guía paso a paso
2. Verifica los logs de error
3. Contacta al equipo de desarrollo

---

**🎯 ¡Con estas APIs configuradas, tu chatbot será mucho más inteligente y útil para los usuarios!**
