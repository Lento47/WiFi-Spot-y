import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import Icon from '../common/Icon.jsx';

const DataExport = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('users');
    const [dateRange, setDateRange] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [exportFormat, setExportFormat] = useState('csv');

    const exportTypes = [
        { id: 'users', label: 'Usuarios', description: 'Información de usuarios, créditos y roles' },
        { id: 'payments', label: 'Pagos', description: 'Historial completo de pagos y transacciones' },
        { id: 'tokens', label: 'Tokens', description: 'Tokens generados y su uso' },
        { id: 'support', label: 'Tickets de Soporte', description: 'Tickets de soporte y respuestas' },
        { id: 'network', label: 'Estado de Red', description: 'Métricas de rendimiento de Starlink' }
    ];

    const dateRanges = [
        { id: 'all', label: 'Todos los datos' },
        { id: 'today', label: 'Hoy' },
        { id: 'yesterday', label: 'Ayer' },
        { id: 'week', label: 'Última semana' },
        { id: 'month', label: 'Último mes' },
        { id: 'quarter', label: 'Último trimestre' },
        { id: 'year', label: 'Último año' },
        { id: 'custom', label: 'Rango personalizado' }
    ];

    const paymentStatuses = [
        { id: 'all', label: 'Todos los estados' },
        { id: 'pending', label: 'Pendiente' },
        { id: 'approved', label: 'Aprobado' },
        { id: 'rejected', label: 'Rechazado' }
    ];

    const getDateRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateRange) {
            case 'today':
                return { start: today, end: now };
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return { start: yesterday, end: today };
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return { start: weekAgo, end: now };
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return { start: monthAgo, end: now };
            case 'quarter':
                const quarterAgo = new Date(today);
                quarterAgo.setMonth(quarterAgo.getMonth() - 3);
                return { start: quarterAgo, end: now };
            case 'year':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                return { start: yearAgo, end: now };
            case 'custom':
                if (customStartDate && customEndDate) {
                    return { 
                        start: new Date(customStartDate), 
                        end: new Date(customEndDate + 'T23:59:59') 
                    };
                }
                return { start: null, end: null };
            default:
                return { start: null, end: null };
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-CR');
    };

    const formatCredits = (minutes) => {
        if (!minutes || minutes < 0) return "0h 0m";
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return `${hours}h ${remainingMinutes}m`;
    };

    const convertToCSV = (data, headers) => {
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header.key] || '';
                    // Escape commas and quotes in CSV
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');
        
        return csvContent;
    };

    const downloadFile = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportUsers = async () => {
        setExportProgress(10);
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(usersQuery);
        setExportProgress(30);
        
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setExportProgress(60);
        
        const headers = [
            { key: 'id', label: 'ID de Usuario' },
            { key: 'email', label: 'Email' },
            { key: 'username', label: 'Nombre de Usuario' },
            { key: 'creditsMinutes', label: 'Créditos (minutos)' },
            { key: 'creditsFormatted', label: 'Créditos (formato)' },
            { key: 'role', label: 'Rol' },
            { key: 'createdAt', label: 'Fecha de Creación' },
            { key: 'lastCreditAdjustment', label: 'Último Ajuste de Créditos' }
        ];

        const data = users.map(user => ({
            ...user,
            creditsFormatted: formatCredits(user.creditsMinutes),
            createdAt: formatDate(user.createdAt),
            lastCreditAdjustment: user.lastCreditAdjustment ? 
                `${user.lastCreditAdjustment.reason} (${formatDate(user.lastCreditAdjustment.timestamp)})` : 'N/A',
            role: user.isAdmin ? 'Admin' : 'User'
        }));

        setExportProgress(90);
        
        const csvContent = convertToCSV(data, headers);
        const filename = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
        downloadFile(csvContent, filename);
        
        setExportProgress(100);
    };

    const exportPayments = async () => {
        setExportProgress(10);
        const dateRange = getDateRange();
        
        let paymentsQuery = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
        
        if (dateRange.start && dateRange.end) {
            paymentsQuery = query(
                collection(db, 'payments'),
                where('createdAt', '>=', dateRange.start),
                where('createdAt', '<=', dateRange.end),
                orderBy('createdAt', 'desc')
            );
        }

        if (statusFilter !== 'all') {
            paymentsQuery = query(
                collection(db, 'payments'),
                where('status', '==', statusFilter),
                orderBy('createdAt', 'desc')
            );
        }

        const snapshot = await getDocs(paymentsQuery);
        setExportProgress(30);
        
        const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setExportProgress(60);
        
        const headers = [
            { key: 'id', label: 'ID de Pago' },
            { key: 'userId', label: 'ID de Usuario' },
            { key: 'userEmail', label: 'Email del Usuario' },
            { key: 'packageName', label: 'Paquete' },
            { key: 'price', label: 'Precio (₡)' },
            { key: 'durationMinutes', label: 'Duración (minutos)' },
            { key: 'durationFormatted', label: 'Duración (formato)' },
            { key: 'status', label: 'Estado' },
            { key: 'sinpeId', label: 'ID SINPE' },
            { key: 'createdAt', label: 'Fecha de Creación' }
        ];

        const data = payments.map(payment => ({
            ...payment,
            durationFormatted: formatCredits(payment.durationMinutes),
            createdAt: formatDate(payment.createdAt),
            userEmail: payment.userEmail || 'N/A'
        }));

        setExportProgress(90);
        
        const csvContent = convertToCSV(data, headers);
        const filename = `pagos_${new Date().toISOString().split('T')[0]}.csv`;
        downloadFile(csvContent, filename);
        
        setExportProgress(100);
    };

    const exportTokens = async () => {
        setExportProgress(10);
        const tokensQuery = query(collection(db, 'tokens'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(tokensQuery);
        setExportProgress(30);
        
        const tokens = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setExportProgress(60);
        
        const headers = [
            { key: 'id', label: 'ID de Token' },
            { key: 'userId', label: 'ID de Usuario' },
            { key: 'tokenString', label: 'Token' },
            { key: 'durationMinutes', label: 'Duración (minutos)' },
            { key: 'durationFormatted', label: 'Duración (formato)' },
            { key: 'status', label: 'Estado' },
            { key: 'createdAt', label: 'Fecha de Creación' },
            { key: 'usedAt', label: 'Fecha de Uso' }
        ];

        const data = tokens.map(token => ({
            ...token,
            durationFormatted: formatCredits(token.durationMinutes),
            createdAt: formatDate(token.createdAt),
            usedAt: token.usedAt ? formatDate(token.usedAt) : 'N/A'
        }));

        setExportProgress(90);
        
        const csvContent = convertToCSV(data, headers);
        const filename = `tokens_${new Date().toISOString().split('T')[0]}.csv`;
        downloadFile(csvContent, filename);
        
        setExportProgress(100);
    };

    const exportSupport = async () => {
        setExportProgress(10);
        const supportQuery = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(supportQuery);
        setExportProgress(30);
        
        const tickets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setExportProgress(60);
        
        const headers = [
            { key: 'id', label: 'ID de Ticket' },
            { key: 'userId', label: 'ID de Usuario' },
            { key: 'userEmail', label: 'Email del Usuario' },
            { key: 'subject', label: 'Asunto' },
            { key: 'category', label: 'Categoría' },
            { key: 'priority', label: 'Prioridad' },
            { key: 'status', label: 'Estado' },
            { key: 'description', label: 'Descripción' },
            { key: 'createdAt', label: 'Fecha de Creación' },
            { key: 'updatedAt', label: 'Última Actualización' },
            { key: 'adminReply', label: 'Respuesta del Admin' }
        ];

        const data = tickets.map(ticket => ({
            ...ticket,
            createdAt: formatDate(ticket.createdAt),
            updatedAt: formatDate(ticket.updatedAt),
            adminReply: ticket.adminReply ? ticket.adminReply.text : 'N/A'
        }));

        setExportProgress(90);
        
        const csvContent = convertToCSV(data, headers);
        const filename = `tickets_soporte_${new Date().toISOString().split('T')[0]}.csv`;
        downloadFile(csvContent, filename);
        
        setExportProgress(100);
    };

    const exportNetwork = async () => {
        setExportProgress(10);
        const networkQuery = query(collection(db, 'networkStatus'), orderBy('timestamp', 'desc'), limit(1440));
        const snapshot = await getDocs(networkQuery);
        setExportProgress(30);
        
        const networkData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setExportProgress(60);
        
        const headers = [
            { key: 'id', label: 'ID de Registro' },
            { key: 'timestamp', label: 'Timestamp' },
            { key: 'status', label: 'Estado' },
            { key: 'downloadSpeed', label: 'Velocidad de Descarga (Mbps)' },
            { key: 'uploadSpeed', label: 'Velocidad de Subida (Mbps)' },
            { key: 'latency', label: 'Latencia (ms)' },
            { key: 'packetLoss', label: 'Pérdida de Paquetes (%)' },
            { key: 'jitter', label: 'Jitter (ms)' }
        ];

        const data = networkData.map(record => ({
            ...record,
            timestamp: formatDate(record.timestamp)
        }));

        setExportProgress(90);
        
        const csvContent = convertToCSV(data, headers);
        const filename = `estado_red_${new Date().toISOString().split('T')[0]}.csv`;
        downloadFile(csvContent, filename);
        
        setExportProgress(100);
    };

    const handleExport = async () => {
        setIsExporting(true);
        setExportProgress(0);
        
        try {
            switch (exportType) {
                case 'users':
                    await exportUsers();
                    break;
                case 'payments':
                    await exportPayments();
                    break;
                case 'tokens':
                    await exportTokens();
                    break;
                case 'support':
                    await exportSupport();
                    break;
                case 'network':
                    await exportNetwork();
                    break;
                default:
                    throw new Error('Tipo de exportación no válido');
            }
            
            // Reset progress after a short delay
            setTimeout(() => {
                setExportProgress(0);
                setIsExporting(false);
            }, 2000);
            
        } catch (error) {
            console.error('Error during export:', error);
            alert('Error durante la exportación. Por favor intente nuevamente.');
            setExportProgress(0);
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                            Exportar Datos
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Exporte información del sistema en formato CSV para análisis y contabilidad
                        </p>
                    </div>
                </div>
            </div>

            {/* Export Configuration */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">
                    Configuración de Exportación
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Export Type */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                            Tipo de Datos a Exportar
                        </label>
                        <div className="space-y-3">
                            {exportTypes.map(type => (
                                <label key={type.id} className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="exportType"
                                        value={type.id}
                                        checked={exportType === type.id}
                                        onChange={(e) => setExportType(e.target.value)}
                                        className="mt-1 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-slate-800 dark:text-slate-200">
                                            {type.label}
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            {type.description}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Date Range and Filters */}
                    <div className="space-y-6">
                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                Rango de Fechas
                            </label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {dateRanges.map(range => (
                                    <option key={range.id} value={range.id}>
                                        {range.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Custom Date Range */}
                        {dateRange === 'custom' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Fecha Inicio
                                    </label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Fecha Fin
                                    </label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Payment Status Filter */}
                        {exportType === 'payments' && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                    Filtrar por Estado
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {paymentStatuses.map(status => (
                                        <option key={status.id} value={status.id}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Export Format */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                Formato de Exportación
                            </label>
                            <select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="csv">CSV (Excel, Google Sheets)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Progress */}
            {isExporting && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                        Exportando Datos...
                    </h3>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-3">
                        <div 
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${exportProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Progreso: {exportProgress}%
                    </p>
                </div>
            )}

            {/* Export Button */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                            Iniciar Exportación
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {exportType === 'payments' && dateRange !== 'all' && (
                                `Se exportarán los pagos del rango de fechas seleccionado`
                            )}
                            {exportType === 'payments' && dateRange === 'all' && (
                                `Se exportarán todos los pagos del sistema`
                            )}
                            {exportType === 'users' && (
                                `Se exportará la información completa de todos los usuarios`
                            )}
                            {exportType === 'tokens' && (
                                `Se exportará el historial completo de tokens generados`
                            )}
                            {exportType === 'support' && (
                                `Se exportará el historial completo de tickets de soporte`
                            )}
                            {exportType === 'network' && (
                                `Se exportarán las métricas de red de las últimas 24 horas`
                            )}
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={isExporting || (dateRange === 'custom' && (!customStartDate || !customEndDate))}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                    >
                        {isExporting ? (
                            <>
                                <Icon path="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" className="w-5 h-5 animate-spin" />
                                Exportando...
                            </>
                        ) : (
                            <>
                                <Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" className="w-5 h-5" />
                                Exportar Datos
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Export Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                    💡 Consejos para la Exportación
                </h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <li>• Los archivos CSV se pueden abrir en Excel, Google Sheets o cualquier editor de texto</li>
                    <li>• Para análisis financieros, use la exportación de "Pagos" con filtros de fecha</li>
                    <li>• La exportación de usuarios es útil para auditorías y reportes de administración</li>
                    <li>• Los datos de red pueden ser útiles para análisis de rendimiento</li>
                    <li>• Los archivos se descargan automáticamente a su carpeta de descargas</li>
                </ul>
            </div>
        </div>
    );
};

export default DataExport;
