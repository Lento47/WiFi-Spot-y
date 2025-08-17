import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEdit3, FiSave, FiUser, FiAlertCircle, FiTag, FiMessageSquare } from 'react-icons/fi';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

const TicketPanel = ({ isOpen, onClose, chatbotContext, onTicketCreated }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Media',
        category: 'Otro',
        contactMethod: 'email',
        contactInfo: '',
        urgency: 'Normal',
        expectedResolution: '24-48 horas'
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [activeField, setActiveField] = useState(null);
    const formRef = useRef(null);

    // Smart suggestions based on active field
    useEffect(() => {
        if (activeField === 'title') {
            setSuggestions([
                'Problema de conexión WiFi',
                'Velocidad de internet lenta',
                'Error en el sistema de pagos',
                'Problema con el programa de referencias',
                'No puedo acceder a mi cuenta'
            ]);
        } else if (activeField === 'description') {
            setSuggestions([
                'Describe paso a paso qué está pasando...',
                '¿Cuándo empezó el problema?',
                '¿Qué has intentado para solucionarlo?',
                '¿En qué dispositivo ocurre?'
            ]);
        } else {
            setSuggestions([]);
        }
    }, [activeField]);

    const handleSuggestionClick = (suggestion) => {
        if (activeField === 'title') {
            setFormData(prev => ({ ...prev, title: suggestion }));
        } else if (activeField === 'description') {
            setFormData(prev => ({ ...prev, description: suggestion }));
        }
        setActiveField(null);
    };

    const priorityColors = {
        'Baja': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'Media': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'Alta': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        'Crítica': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    const urgencyColors = {
        'Normal': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'Urgente': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        'Crítico': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };

    // Helper functions to map form values to Support component IDs
    const mapCategoryToId = (category) => {
        const categoryMap = {
            'Conexión WiFi': 'connection',
            'Pagos y Facturación': 'billing',
            'Programa de Referencias': 'other',
            'Cuenta y Perfil': 'account',
            'Otro': 'other'
        };
        return categoryMap[category] || 'other';
    };

    const mapPriorityToId = (priority) => {
        const priorityMap = {
            'Baja': 'low',
            'Media': 'medium',
            'Alta': 'high',
            'Crítica': 'urgent'
        };
        return priorityMap[priority] || 'medium';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        console.log('TicketPanel: handleSubmit called');
        console.log('TicketPanel: user:', user);
        console.log('TicketPanel: user.uid:', user?.uid);
        
        if (!user?.uid) {
            alert('Debe iniciar sesión para crear un ticket');
            setIsSubmitting(false);
            return;
        }
        
        try {
            // Map the form data to match the Support component's expected structure
            const ticketData = {
                userId: user.uid,
                userEmail: user.email,
                subject: formData.title,
                category: mapCategoryToId(formData.category),
                priority: mapPriorityToId(formData.priority),
                description: formData.description,
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date(),
                // Additional fields from the form
                contactMethod: formData.contactMethod,
                contactInfo: formData.contactInfo,
                urgency: formData.urgency,
                expectedResolution: formData.expectedResolution
            };
            
            console.log('Creating ticket with data:', ticketData);
            console.log('TicketPanel: db object:', db);
            console.log('TicketPanel: collection function:', collection);
            console.log('TicketPanel: addDoc function:', addDoc);
            
            // Create ticket in Firestore
            const docRef = await addDoc(collection(db, 'supportTickets'), ticketData);
            console.log('Ticket created successfully with ID:', docRef.id);
            
            // Immediately fetch the ticket to verify it was created
            try {
                const ticketDoc = await getDoc(doc(db, 'supportTickets', docRef.id));
                if (ticketDoc.exists()) {
                    console.log('✅ Ticket verified in Firestore:', ticketDoc.data());
                } else {
                    console.log('❌ Ticket not found in Firestore after creation');
                }
            } catch (error) {
                console.error('Error verifying ticket:', error);
            }
            
            // Create the ticket data for the callback (with the generated ID)
            const createdTicketData = {
                ...ticketData,
                id: docRef.id,
                createdAt: new Date(),
                status: 'open',
                assignedTo: 'Soporte Técnico'
            };
            
            // Notify parent component
            onTicketCreated(createdTicketData);
            
            // Reset form
            setFormData({
                title: '',
                description: '',
                priority: 'Media',
                category: 'Otro',
                contactMethod: 'email',
                contactInfo: '',
                urgency: 'Normal',
                expectedResolution: '24-48 horas'
            });
            
            // Close panel
            onClose();
            
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Error al crear el ticket. Por favor intente nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
                        ref={formRef}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <FiEdit3 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Crear Ticket de Soporte</h2>
                                        <p className="text-green-100">Describe tu problema en detalle</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                        <FiAlertCircle className="inline w-4 h-4 mr-2" />
                                        Título del problema *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        onFocus={() => setActiveField('title')}
                                        onBlur={() => setTimeout(() => setActiveField(null), 200)}
                                        className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg"
                                        placeholder="Describe brevemente el problema..."
                                    />
                                    {activeField === 'title' && suggestions.length > 0 && (
                                        <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">💡 Sugerencias:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {suggestions.map((suggestion, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => handleSuggestionClick(suggestion)}
                                                        className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                        <FiMessageSquare className="inline w-4 h-4 mr-2" />
                                        Descripción detallada *
                                    </label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        onFocus={() => setActiveField('description')}
                                        onBlur={() => setTimeout(() => setActiveField(null), 200)}
                                        className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none text-lg"
                                        placeholder="Explica tu problema paso a paso, incluye detalles como cuándo empezó, qué has intentado, etc..."
                                    />
                                    {activeField === 'description' && suggestions.length > 0 && (
                                        <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">💡 Consejos para una mejor descripción:</p>
                                            <div className="space-y-2">
                                                {suggestions.map((suggestion, index) => (
                                                    <div key={index} className="text-sm text-slate-600 dark:text-slate-400">
                                                        • {suggestion}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Priority and Category Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                            <FiAlertCircle className="inline w-4 h-4 mr-2" />
                                            Prioridad *
                                        </label>
                                        <select
                                            required
                                            value={formData.priority}
                                            onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                            className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg"
                                        >
                                            <option value="Baja">Baja</option>
                                            <option value="Media">Media</option>
                                            <option value="Alta">Alta</option>
                                            <option value="Crítica">Crítica</option>
                                        </select>
                                        <div className="mt-3">
                                            <span className={`inline-block px-3 py-2 text-sm rounded-full ${priorityColors[formData.priority]}`}>
                                                {formData.priority}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                            <FiTag className="inline w-4 h-4 mr-2" />
                                            Categoría *
                                        </label>
                                        <select
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg"
                                        >
                                            <option value="Conexión WiFi">Conexión WiFi</option>
                                            <option value="Pagos y Facturación">Pagos y Facturación</option>
                                            <option value="Programa de Referencias">Programa de Referencias</option>
                                            <option value="Cuenta y Perfil">Cuenta y Perfil</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Urgency and Resolution Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                            <FiAlertCircle className="inline w-4 h-4 mr-2" />
                                            Nivel de urgencia
                                        </label>
                                        <select
                                            value={formData.urgency}
                                            onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                                            className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg"
                                        >
                                            <option value="Normal">Normal</option>
                                            <option value="Urgente">Urgente</option>
                                            <option value="Crítico">Crítico</option>
                                        </select>
                                        <div className="mt-3">
                                            <span className={`inline-block px-3 py-2 text-sm rounded-full ${urgencyColors[formData.urgency]}`}>
                                                {formData.urgency}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                            <FiAlertCircle className="inline w-4 h-4 mr-2" />
                                            Resolución esperada
                                        </label>
                                        <select
                                            value={formData.expectedResolution}
                                            onChange={(e) => setFormData({...formData, expectedResolution: e.target.value})}
                                            className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg"
                                        >
                                            <option value="Inmediata">Inmediata</option>
                                            <option value="2-4 horas">2-4 horas</option>
                                            <option value="24-48 horas">24-48 horas</option>
                                            <option value="3-5 días">3-5 días</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                        <FiUser className="inline w-4 h-4 mr-2" />
                                        Método de contacto preferido *
                                    </label>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <select
                                                required
                                                value={formData.contactMethod}
                                                onChange={(e) => setFormData({...formData, contactMethod: e.target.value})}
                                                className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg"
                                            >
                                                <option value="email">Email</option>
                                                <option value="phone">Teléfono</option>
                                                <option value="whatsapp">WhatsApp</option>
                                                <option value="in_app">En la aplicación</option>
                                            </select>
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                required
                                                value={formData.contactInfo}
                                                onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                                                className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg"
                                                placeholder={formData.contactMethod === 'email' ? 'tu@email.com' : 
                                                           formData.contactMethod === 'phone' ? '+506 1234 5678' : 
                                                           formData.contactMethod === 'whatsapp' ? '+506 1234 5678' : 
                                                           'Usuario de la aplicación'}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Validation Status */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Estado de validación:</p>
                                    <div className="space-y-1 text-sm">
                                        <div className={`flex items-center gap-2 ${formData.title ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {formData.title ? '✅' : '❌'} Título: {formData.title ? 'Completado' : 'Falta completar'}
                                        </div>
                                        <div className={`flex items-center gap-2 ${formData.description ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {formData.description ? '✅' : '❌'} Descripción: {formData.description ? 'Completada' : 'Falta completar'}
                                        </div>
                                        <div className={`flex items-center gap-2 ${formData.contactInfo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {formData.contactInfo ? '✅' : '❌'} Contacto: {formData.contactInfo ? 'Completado' : 'Falta completar'}
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex gap-6 pt-6">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-8 py-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !formData.title || !formData.description || !formData.contactInfo}
                                        className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-3 text-lg"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Creando ticket...
                                            </>
                                        ) : (
                                            <>
                                                <FiSave className="w-5 h-5" />
                                                Crear Ticket
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TicketPanel;
