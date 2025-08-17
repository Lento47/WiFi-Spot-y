import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AIChatbot from '../common/AIChatbot.jsx';

const Help = () => {
    const [activeSection, setActiveSection] = useState('overview');

    const helpSections = [
        {
            id: 'overview',
            title: '📋 Resumen General',
            icon: '🎯',
            content: `
                <h3 class="text-xl font-bold mb-4">Bienvenido a WiFi Hub</h3>
                <p class="mb-4">WiFi Hub es un sistema completo de gestión para servicios WiFi Starlink. Proporciona autenticación de usuarios, procesamiento de pagos, monitoreo de red, tickets de soporte y características comunitarias en una interfaz moderna con efecto glass-morphism.</p>
                
                <h4 class="font-semibold mb-2">🎨 Filosofía de Diseño</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li><strong>Glass Morphism:</strong> UI moderna y transparente con efectos de desenfoque</li>
                    <li><strong>Diseño Responsivo:</strong> Funciona perfectamente en dispositivos de escritorio y móviles</li>
                    <li><strong>Modo Oscuro/Claro:</strong> Cambio automático de tema con contraste adecuado</li>
                    <li><strong>Elementos Interactivos:</strong> Animaciones suaves y efectos hover</li>
                </ul>
            `
        },
        {
            id: 'features',
            title: '✨ Características Principales',
            icon: '🚀',
            content: `
                <h3 class="text-xl font-bold mb-4">Funcionalidades del Sistema</h3>
                
                <h4 class="font-semibold mb-2">🔐 Sistema de Autenticación</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li><strong>Inicio de Sesión con Google:</strong> Autenticación de un clic con cuentas de Google</li>
                    <li><strong>Email/Contraseña:</strong> Registro e inicio de sesión tradicional basado en email</li>
                    <li><strong>Códigos de Referencia:</strong> Los usuarios pueden registrarse con códigos de referencia para créditos bonus</li>
                    <li><strong>Acceso Basado en Roles:</strong> Roles de Admin, Reportero y Usuario Regular</li>
                </ul>

                <h4 class="font-semibold mb-2">💳 Gestión de Pagos</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li><strong>Sistema de Paquetes:</strong> Paquetes WiFi definidos por el admin con tiempo y precio</li>
                    <li><strong>Integración SINPE:</strong> Integración con el sistema de pagos costarricense</li>
                    <li><strong>Aprobación de Pagos:</strong> Flujo de trabajo de aprobación de admin para pagos</li>
                    <li><strong>Generación de Recibos:</strong> Recibos descargables en formatos PNG/JPEG</li>
                    <li><strong>Validación QR:</strong> Validación de transacciones vía códigos QR</li>
                </ul>

                <h4 class="font-semibold mb-2">📊 Monitoreo de Red</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li><strong>Estado en Tiempo Real:</strong> Monitoreo en vivo de la conexión Starlink</li>
                    <li><strong>Datos Históricos:</strong> Seguimiento del rendimiento de la red a lo largo del tiempo</li>
                    <li><strong>Visualización de Datos:</strong> Gráficos Chart.js para tiempo de actividad, velocidad y latencia</li>
                </ul>
            `
        },
        {
            id: 'user-guide',
            title: '👥 Guía del Usuario',
            icon: '📖',
            content: `
                <h3 class="text-xl font-bold mb-4">Cómo Usar WiFi Hub</h3>
                
                <h4 class="font-semibold mb-2">🔐 Registro de Usuario</h4>
                <ol class="list-decimal list-inside space-y-1 mb-4">
                    <li><strong>Acceso:</strong> Navega a la página de inicio de sesión</li>
                    <li><strong>Registro:</strong> Haz clic en "Crear Cuenta"</li>
                    <li><strong>Código de Referencia:</strong> Ingresa código de referencia (opcional)</li>
                    <li><strong>Nombre de Usuario:</strong> Elige un nombre de usuario único para características comunitarias</li>
                    <li><strong>Verificación:</strong> Se requiere verificación de email</li>
                </ol>

                <h4 class="font-semibold mb-2">💰 Sistema de Pagos</h4>
                <ol class="list-decimal list-inside space-y-1 mb-4">
                    <li><strong>Seleccionar Paquete:</strong> Elige entre paquetes WiFi disponibles</li>
                    <li><strong>Pago:</strong> Completa el pago SINPE</li>
                    <li><strong>Verificación:</strong> El admin revisa y aprueba el pago</li>
                    <li><strong>Adición de Créditos:</strong> Los créditos se agregan automáticamente a tu cuenta</li>
                </ol>

                <h4 class="font-semibold mb-2">🎫 Sistema de Soporte</h4>
                <ol class="list-decimal list-inside space-y-1 mb-4">
                    <li><strong>Acceso:</strong> Portal de Usuario → Pestaña Soporte</li>
                    <li><strong>Crear Ticket:</strong> Selecciona categoría y prioridad</li>
                    <li><strong>Descripción:</strong> Proporciona descripción detallada del problema</li>
                    <li><strong>Envío:</strong> El ticket se envía al admin para revisión</li>
                </ol>
            `
        },
        {
            id: 'community',
            title: '🌟 Características Comunitarias',
            icon: '🏘️',
            content: `
                <h3 class="text-xl font-bold mb-4">Participación Comunitaria</h3>
                
                <h4 class="font-semibold mb-2">📢 Tablero Digital</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li><strong>Creación de Publicaciones:</strong> Los admins y reporteros pueden crear publicaciones</li>
                    <li><strong>Moderación de Contenido:</strong> Publicación controlada por el admin</li>
                    <li><strong>Interacción del Usuario:</strong> Sistema de comentarios y participación comunitaria</li>
                    <li><strong>Soporte de Medios:</strong> Contenido rico con imágenes y formato</li>
                </ul>

                <h4 class="font-semibold mb-2">🎁 Programa de Referencias</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li><strong>Generación Automática:</strong> Códigos únicos para cada usuario</li>
                    <li><strong>Recompensas de Créditos:</strong> Distribución automática de créditos</li>
                    <li><strong>Protección Anti-Abuso:</strong> Períodos de enfriamiento y sistema de strikes</li>
                    <li><strong>Seguimiento de Actividad:</strong> Monitoreo de tasas de éxito de referencias</li>
                </ul>

                <h4 class="font-semibold mb-2">📱 Optimización Móvil</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li><strong>Diseño Responsivo:</strong> Optimizado para dispositivos móviles</li>
                    <li><strong>Interfaz Táctil:</strong> Controles amigables al tacto</li>
                    <li><strong>Escaneo QR:</strong> Validación de transacciones basada en cámara</li>
                    <li><strong>Gesto Táctil:</strong> Interacciones de deslizar y tocar</li>
                </ul>
            `
        },
        {
            id: 'troubleshooting',
            title: '🔧 Solución de Problemas',
            icon: '🛠️',
            content: `
                <h3 class="text-xl font-bold mb-4">Problemas Comunes y Soluciones</h3>
                
                <h4 class="font-semibold mb-2">❌ Error de Conexión Firebase</h4>
                <p class="mb-2">Si experimentas problemas de conexión:</p>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li>Verifica que estés conectado a internet</li>
                    <li>Intenta recargar la página</li>
                    <li>Contacta al administrador si el problema persiste</li>
                </ul>

                <h4 class="font-semibold mb-2">🔐 Problemas de Inicio de Sesión</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li>Verifica que tu email esté correctamente escrito</li>
                    <li>Asegúrate de que tu contraseña tenga al menos 8 caracteres</li>
                    <li>Si usas Google Sign-In, asegúrate de estar logueado en tu cuenta de Google</li>
                </ul>

                <h4 class="font-semibold mb-2">💳 Problemas de Pago</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li>Verifica que el ID SINPE sea correcto</li>
                    <li>Asegúrate de que el monto coincida con el paquete seleccionado</li>
                    <li>Los pagos pueden tardar hasta 24 horas en ser aprobados</li>
                    <li>Contacta al soporte si tu pago no aparece después de 24 horas</li>
                </ul>

                <h4 class="font-semibold mb-2">📱 Problemas Móviles</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li>Verifica que tu navegador móvil esté actualizado</li>
                    <li>Intenta usar el modo de escritorio si hay problemas de visualización</li>
                    <li>Para escaneo QR, asegúrate de dar permisos de cámara</li>
                </ul>
            `
        },
        {
            id: 'contact',
            title: '📞 Contacto y Soporte',
            icon: '📞',
            content: `
                <h3 class="text-xl font-bold mb-4">Obtener Ayuda</h3>
                
                <h4 class="font-semibold mb-2">🎫 Sistema de Tickets</h4>
                <p class="mb-4">La mejor manera de obtener ayuda es crear un ticket de soporte:</p>
                <ol class="list-decimal list-inside space-y-1 mb-4">
                    <li>Ve a la pestaña "Soporte" en tu portal de usuario</li>
                    <li>Selecciona la categoría apropiada para tu problema</li>
                    <li>Describe tu problema en detalle</li>
                    <li>Envía el ticket y espera la respuesta del administrador</li>
                </ol>

                <h4 class="font-semibold mb-2">📧 Contacto Directo</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li><strong>Problemas Técnicos:</strong> Usa el sistema de tickets de soporte</li>
                    <li><strong>Solicitudes de Características:</strong> Contacta al administrador</li>
                    <li><strong>Emergencias:</strong> Contacta al equipo de desarrollo</li>
                </ul>

                <h4 class="font-semibold mb-2">📚 Recursos Adicionales</h4>
                <ul class="list-disc list-inside space-y-1 mb-4">
                    <li><strong>Documentación:</strong> Esta guía de ayuda y archivos README</li>
                    <li><strong>Repositorio de Código:</strong> Problemas y discusiones de GitHub</li>
                    <li><strong>Comunidad:</strong> Foros comunitarios de usuarios</li>
                </ul>

                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mt-6">
                    <h4 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Consejo</h4>
                    <p class="text-blue-700 dark:text-blue-300 text-sm">Antes de crear un ticket de soporte, revisa esta guía de ayuda. Muchos problemas comunes tienen soluciones simples que puedes implementar tú mismo.</p>
                </div>
            `
        }
    ];

    return (
        <div className="max-w-4xl mx-auto p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
            >
                <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                    🆘 Centro de Ayuda
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                    Encuentra respuestas a todas tus preguntas sobre WiFi Hub
                </p>
            </motion.div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {helpSections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            activeSection === section.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                    >
                        <span className="mr-2">{section.icon}</span>
                        {section.title}
                    </button>
                ))}
            </div>

            {/* Content Area with Enhanced Glass Divider */}
            <div className="relative">
                {/* Enhanced Glass Morphism Divider */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 z-20">
                    {/* Main Glass Divider */}
                    <div className="w-1 h-full bg-gradient-to-b from-transparent via-blue-400/60 via-purple-500/60 via-pink-400/60 to-transparent dark:from-transparent dark:via-blue-300/60 dark:via-purple-400/60 dark:via-pink-300/60 dark:to-transparent rounded-full shadow-2xl"></div>
                    
                    {/* Glowing Orbs */}
                    <motion.div
                        animate={{
                            y: [0, -10, 0],
                            opacity: [0.6, 1, 0.6],
                            scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-lg shadow-blue-400/50"
                    ></motion.div>
                    
                    <motion.div
                        animate={{
                            y: [0, 10, 0],
                            opacity: [0.6, 1, 0.6],
                            scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5
                        }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full shadow-lg shadow-purple-400/50"
                    ></motion.div>
                    
                    <motion.div
                        animate={{
                            y: [0, -8, 0],
                            opacity: [0.6, 1, 0.6],
                            scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                        className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-3.5 h-3.5 bg-gradient-to-r from-pink-400 to-blue-500 rounded-full shadow-lg shadow-pink-400/50"
                    ></motion.div>
                    
                    {/* Floating Particles */}
                    <motion.div
                        animate={{
                            y: [0, -20, 0],
                            x: [0, 5, 0],
                            rotate: [0, 180, 360]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-1/6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-60"
                    ></motion.div>
                    
                    <motion.div
                        animate={{
                            y: [0, 15, 0],
                            x: [0, -3, 0],
                            rotate: [0, -180, -360]
                        }}
                        transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1.5
                        }}
                        className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full opacity-70"
                    ></motion.div>
                    
                    {/* Energy Waves */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0, 0.3]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="w-8 h-8 border border-blue-400/30 rounded-full"
                        ></motion.div>
                        <motion.div
                            animate={{
                                scale: [1, 2, 1],
                                opacity: [0.2, 0, 0.2]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.5
                            }}
                            className="absolute w-12 h-12 border border-purple-400/30 rounded-full"
                        ></motion.div>
                        <motion.div
                            animate={{
                                scale: [1, 2.5, 1],
                                opacity: [0.1, 0, 0.1]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1
                            }}
                            className="absolute w-16 h-16 border border-pink-400/30 rounded-full"
                        ></motion.div>
                    </div>
                    
                    {/* Glass Morphism Overlay */}
                    <div className="absolute inset-0 w-1 h-full bg-gradient-to-b from-white/20 via-white/10 to-white/20 dark:from-slate-300/20 dark:via-slate-300/10 dark:to-slate-300/20 rounded-full backdrop-blur-sm"></div>
                    
                    {/* Dynamic Light Rays */}
                    <motion.div
                        animate={{
                            rotate: [0, 360]
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute inset-0 w-1 h-full"
                    >
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-blue-400/40 to-transparent"></div>
                        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-purple-400/40 to-transparent"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-pink-400/40 to-transparent"></div>
                        <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-blue-400/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-purple-400/40 to-transparent"></div>
                    </motion.div>
                    
                    {/* Floating Sparkles */}
                    <motion.div
                        animate={{
                            y: [0, -15, 0],
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-1/8 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-300 rounded-full shadow-lg shadow-yellow-300/70"
                    ></motion.div>
                    
                    <motion.div
                        animate={{
                            y: [0, 12, 0],
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.8
                        }}
                        className="absolute bottom-1/8 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-300 rounded-full shadow-lg shadow-cyan-300/70"
                    ></motion.div>
                </div>
                
                {/* Content Panels with Enhanced Glass Effects */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Panel */}
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-2xl shadow-2xl p-6 lg:p-8 border border-white/30 dark:border-slate-700/30 relative overflow-hidden group hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-500"
                    >
                        {/* Enhanced Glass effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-white/5 to-white/10 dark:from-slate-700/15 dark:via-slate-600/5 dark:to-slate-700/10 rounded-2xl group-hover:from-white/20 group-hover:via-white/10 group-hover:to-white/15 dark:group-hover:from-slate-700/20 dark:group-hover:via-slate-600/10 dark:group-hover:to-slate-700/15 transition-all duration-500"></div>
                        
                        {/* Subtle inner glow */}
                        <div className="absolute inset-2 bg-gradient-to-br from-blue-400/5 via-transparent to-purple-400/5 dark:from-blue-300/10 dark:via-transparent dark:to-purple-300/10 rounded-xl"></div>
                        
                        {/* Content wrapper */}
                        <div className="relative z-10">
                            <div 
                                className="prose prose-slate dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ 
                                    __html: helpSections.find(s => s.id === activeSection)?.content || '' 
                                }}
                            />
                        </div>
                    </motion.div>

                    {/* Right Panel - Additional Info */}
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-2xl rounded-2xl shadow-2xl p-6 lg:p-8 border border-white/25 dark:border-slate-700/25 relative overflow-hidden group hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-500"
                    >
                        {/* Enhanced Glass effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/25 via-purple-50/15 to-pink-50/20 dark:from-blue-900/25 dark:via-purple-900/15 dark:to-pink-900/20 rounded-2xl group-hover:from-blue-50/30 group-hover:via-purple-50/20 group-hover:to-pink-50/25 dark:group-hover:from-blue-900/30 dark:group-hover:via-purple-900/20 dark:group-hover:to-pink-900/25 transition-all duration-500"></div>
                        
                        {/* Subtle inner glow */}
                        <div className="absolute inset-2 bg-gradient-to-br from-purple-400/5 via-transparent to-pink-400/5 dark:from-purple-300/10 dark:via-transparent dark:to-pink-300/10 rounded-xl"></div>
                        
                        {/* Content wrapper */}
                        <div className="relative z-10">
                            {activeSection === 'overview' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">💡 Consejos Rápidos</h3>
                                    <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            <span>Usa el modo oscuro para mejor experiencia visual</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-purple-500 mr-2">•</span>
                                            <span>Mantén tu navegador actualizado para mejor rendimiento</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">•</span>
                                            <span>Guarda tus códigos de referencia en un lugar seguro</span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                            
                            {activeSection === 'features' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">🔍 Características Avanzadas</h3>
                                    <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            <span>Notificaciones en tiempo real para pagos y créditos</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-purple-500 mr-2">•</span>
                                            <span>Historial completo de transacciones</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">•</span>
                                            <span>Exportación de datos para análisis personal</span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                            
                            {activeSection === 'user-guide' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">📋 Pasos Detallados</h3>
                                    <div className="space-y-4 text-slate-700 dark:text-slate-300">
                                        <div>
                                            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Registro de Usuario</h4>
                                            <p className="text-sm">El proceso completo toma aproximadamente 5 minutos. Asegúrate de tener tu email y contraseña listos.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Sistema de Pagos</h4>
                                            <p className="text-sm">Los pagos se procesan automáticamente una vez aprobados por el administrador.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {activeSection === 'community' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">🏘️ Participación Activa</h3>
                                    <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            <span>Comenta en publicaciones para ganar visibilidad</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-purple-500 mr-2">•</span>
                                            <span>Comparte tu código de referencia en redes sociales</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">•</span>
                                            <span>Reporta contenido inapropiado a los administradores</span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                            
                            {activeSection === 'troubleshooting' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">⚡ Soluciones Rápidas</h3>
                                    <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            <span>Limpia el caché del navegador si hay problemas de carga</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-purple-500 mr-2">•</span>
                                            <span>Verifica tu conexión a internet antes de reportar problemas</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">•</span>
                                            <span>Usa el modo incógnito para probar problemas de sesión</span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                            
                            {activeSection === 'contact' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">📞 Canales de Contacto</h3>
                                    <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                                        <li className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            <span>Tickets de soporte: Respuesta en 24-48 horas</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-purple-500 mr-2">•</span>
                                            <span>Contacto directo: Para emergencias técnicas</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">•</span>
                                            <span>Comunidad: Para preguntas generales y consejos</span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* AI Chatbot Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 text-center"
            >
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-2xl p-8 border border-indigo-200 dark:border-slate-500">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                        💬 Asistente Virtual AI
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
                        ¿Tienes una pregunta rápida? ¡Nuestro asistente virtual AI está disponible 24/7 para ayudarte! 
                        Puede responder preguntas sobre conexión WiFi, pagos, referencias y mucho más.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-indigo-200 dark:border-slate-600">
                            <div className="text-3xl mb-2">⚡</div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Respuestas Instantáneas</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Obtén ayuda inmediata para preguntas comunes</p>
                        </div>
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-200 dark:border-slate-600">
                            <div className="text-3xl mb-2">🌐</div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Disponible 24/7</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Accede a soporte en cualquier momento del día</p>
                        </div>
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-pink-200 dark:border-slate-600">
                            <div className="text-3xl mb-2">🎯</div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Información Precisa</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Respuestas basadas en nuestra base de conocimientos</p>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                        <h4 className="text-xl font-bold mb-3">🚀 ¿Cómo Usar el Chatbot?</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                            <div className="space-y-2">
                                <p className="flex items-center gap-2"><span className="text-2xl">1️⃣</span> Busca el botón flotante azul</p>
                                <p className="flex items-center gap-2"><span className="text-2xl">2️⃣</span> Haz clic para abrir el chat</p>
                            </div>
                            <div className="space-y-2">
                                <p className="flex items-center gap-2"><span className="text-2xl">3️⃣</span> Escribe tu pregunta</p>
                                <p className="flex items-center gap-2"><span className="text-2xl">4️⃣</span> ¡Recibe ayuda instantánea!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 text-center"
            >
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6 border border-blue-200 dark:border-slate-500">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                        🚀 ¿Necesitas Más Ayuda?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Si no encuentras la respuesta que buscas, no dudes en contactarnos
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                            📝 Crear Ticket de Soporte
                        </button>
                        <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
                            💬 Contactar Admin
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Enhanced Documentation Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8"
            >
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-2xl p-8 border border-green-200 dark:border-slate-500">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 text-center">
                        📚 Recursos de Aprendizaje
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* User Guide */}
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-green-200 dark:border-slate-600 hover:shadow-lg transition-all duration-300">
                            <div className="text-4xl mb-4">📖</div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Guía del Usuario</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Manual completo con instrucciones paso a paso para todas las funciones
                            </p>
                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                <li>• Registro y configuración de cuenta</li>
                                <li>• Proceso de pagos y créditos</li>
                                <li>• Uso de características comunitarias</li>
                                <li>• Solución de problemas comunes</li>
                            </ul>
                        </div>

                        {/* Video Tutorials */}
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-200 dark:border-slate-600 hover:shadow-lg transition-all duration-300">
                            <div className="text-4xl mb-4">🎥</div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Tutoriales en Video</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Videos explicativos para funciones complejas del sistema
                            </p>
                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                <li>• Configuración inicial de cuenta</li>
                                <li>• Proceso de pago paso a paso</li>
                                <li>• Uso del programa de referencias</li>
                                <li>• Navegación en dispositivos móviles</li>
                            </ul>
                        </div>

                        {/* FAQ Section */}
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-200 dark:border-slate-600 hover:shadow-lg transition-all duration-300">
                            <div className="text-4xl mb-4">❓</div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Preguntas Frecuentes</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Respuestas a las preguntas más comunes de los usuarios
                            </p>
                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                <li>• Problemas de conexión</li>
                                <li>• Gestión de créditos</li>
                                <li>• Seguridad de la cuenta</li>
                                <li>• Políticas del sistema</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-green-300 dark:border-slate-500">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3">
                                🚀 ¿Necesitas Ayuda Especializada?
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Nuestro equipo de soporte está disponible para ayudarte con cualquier consulta técnica o funcional
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
                                    📧 Contactar Soporte
                                </button>
                                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                                    💬 Chat en Vivo
                                </button>
                                <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
                                    📱 WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
            
            {/* AI Chatbot Component */}
            <AIChatbot />
        </div>
    );
};

export default Help;
