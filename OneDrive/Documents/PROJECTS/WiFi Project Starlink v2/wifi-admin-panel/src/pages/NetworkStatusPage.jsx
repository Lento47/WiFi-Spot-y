import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Chart from 'chart.js/auto';

const NetworkStatusPage = () => {
    const [statusHistory, setStatusHistory] = useState([]);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReloading, setIsReloading] = useState(false);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    const fetchNetworkStatus = () => {
        setIsReloading(true);
        // Get the last 24 hours of data (1440 minutes)
        const q = query(
            collection(db, "networkStatus"), 
            orderBy("timestamp", "desc"),
            limit(1440)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStatusHistory(history);
            if (history.length > 0) {
                setCurrentStatus(history[0]);
            }
            setIsLoading(false);
            setIsReloading(false);
        }, (error) => {
            console.error("Error fetching network status:", error);
            setIsLoading(false);
            setIsReloading(false);
        });

        return unsubscribe;
    };

    useEffect(() => {
        const unsubscribe = fetchNetworkStatus();
        return () => unsubscribe;
    }, []);

    // Listen for theme changes and refresh chart
    useEffect(() => {
        const handleThemeChange = () => {
            if (chartInstance.current && statusHistory.length > 0) {
                // Force chart refresh when theme changes
                setTimeout(() => {
                    if (chartRef.current) {
                        const labels = statusHistory.map(s => new Date(s.timestamp.seconds * 1000).toLocaleTimeString('es-CR')).reverse();
                        const downloadData = statusHistory.map(s => s.downloadSpeed).reverse();
                        const uploadData = statusHistory.map(s => s.uploadSpeed).reverse();
                        const latencyData = statusHistory.map(s => s.latency).reverse();

                        chartInstance.current.destroy();
                        
                        const ctx = chartRef.current.getContext('2d');
                        const isDark = document.documentElement.classList.contains('dark');
                        
                        chartInstance.current = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels,
                                datasets: [
                                    { 
                                        label: 'Descarga (Mbps)', 
                                        data: downloadData, 
                                        borderColor: 'rgb(59, 130, 246)', 
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        tension: 0.1, 
                                        yAxisID: 'y',
                                        fill: true
                                    },
                                    { 
                                        label: 'Subida (Mbps)', 
                                        data: uploadData, 
                                        borderColor: 'rgb(34, 197, 94)', 
                                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                        tension: 0.1, 
                                        yAxisID: 'y',
                                        fill: true
                                    },
                                    { 
                                        label: 'Latencia (ms)', 
                                        data: latencyData, 
                                        borderColor: 'rgb(239, 68, 68)', 
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        tension: 0.1, 
                                        yAxisID: 'y1',
                                        fill: false
                                    },
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                interaction: {
                                    mode: 'index',
                                    intersect: false,
                                },
                                plugins: {
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            color: isDark ? '#e2e8f0' : '#1e293b'
                                        }
                                    },
                                    tooltip: {
                                        mode: 'index',
                                        intersect: false,
                                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                        titleColor: isDark ? '#e2e8f0' : '#1e293b',
                                        bodyColor: isDark ? '#e2e8f0' : '#1e293b'
                                    }
                                },
                                scales: {
                                    x: {
                                        display: true,
                                        title: {
                                            display: true,
                                            text: 'Hora del día',
                                            color: isDark ? '#e2e8f0' : '#1e293b'
                                        },
                                        ticks: {
                                            color: isDark ? '#e2e8f0' : '#1e293b'
                                        },
                                        grid: {
                                            color: isDark ? 'rgba(226, 232, 240, 0.1)' : 'rgba(30, 41, 59, 0.1)'
                                        }
                                    },
                                    y: { 
                                        type: 'linear', 
                                        display: true, 
                                        position: 'left', 
                                        title: { 
                                            display: true, 
                                            text: 'Velocidad (Mbps)',
                                            color: isDark ? '#e2e8f0' : '#1e293b'
                                        },
                                        beginAtZero: true,
                                        ticks: {
                                            color: isDark ? '#e2e8f0' : '#1e293b'
                                        },
                                        grid: {
                                            color: isDark ? 'rgba(226, 232, 240, 0.1)' : 'rgba(30, 41, 59, 0.1)'
                                        }
                                    },
                                    y1: { 
                                        type: 'linear', 
                                        display: true, 
                                        position: 'right', 
                                        title: { 
                                            display: true, 
                                            text: 'Latencia (ms)',
                                            color: isDark ? '#e2e8f0' : '#1e293b'
                                        }, 
                                        grid: { drawOnChartArea: false },
                                        beginAtZero: true,
                                        ticks: {
                                            color: isDark ? '#e2e8f0' : '#1e293b'
                                        }
                                    },
                                }
                            }
                        });
                    }
                }, 100);
            }
        };

        // Create a mutation observer to watch for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    handleThemeChange();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, [statusHistory]);

    const handleReload = async () => {
        setIsReloading(true);
        
        // Destroy existing chart
        if (chartInstance.current) {
            chartInstance.current.destroy();
            chartInstance.current = null;
        }
        
        try {
            // Force a fresh fetch by getting the data directly instead of using the cached snapshot
            const q = query(
                collection(db, "networkStatus"), 
                orderBy("timestamp", "desc"),
                limit(1440)
            );
            
            const snapshot = await getDocs(q);
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setStatusHistory(history);
            if (history.length > 0) {
                setCurrentStatus(history[0]);
            }
            
            console.log('Network status refreshed with fresh data:', history.length, 'records');
        } catch (error) {
            console.error("Error refreshing network status:", error);
        } finally {
            setIsReloading(false);
        }
    };

    useEffect(() => {
        if (statusHistory.length > 0 && chartRef.current) {
            const labels = statusHistory.map(s => new Date(s.timestamp.seconds * 1000).toLocaleTimeString('es-CR')).reverse();
            const downloadData = statusHistory.map(s => s.downloadSpeed).reverse();
            const uploadData = statusHistory.map(s => s.uploadSpeed).reverse();
            const latencyData = statusHistory.map(s => s.latency).reverse();

            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            
            // Get current theme for chart colors
            const isDark = document.documentElement.classList.contains('dark');
            
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { 
                            label: 'Descarga (Mbps)', 
                            data: downloadData, 
                            borderColor: 'rgb(59, 130, 246)', 
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.1, 
                            yAxisID: 'y',
                            fill: true
                        },
                        { 
                            label: 'Subida (Mbps)', 
                            data: uploadData, 
                            borderColor: 'rgb(34, 197, 94)', 
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            tension: 0.1, 
                            yAxisID: 'y',
                            fill: true
                        },
                        { 
                            label: 'Latencia (ms)', 
                            data: latencyData, 
                            borderColor: 'rgb(239, 68, 68)', 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            tension: 0.1, 
                            yAxisID: 'y1',
                            fill: false
                        },
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: isDark ? '#e2e8f0' : '#1e293b'
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                            titleColor: isDark ? '#e2e8f0' : '#1e293b',
                            bodyColor: isDark ? '#e2e8f0' : '#1e293b'
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Hora del día',
                                color: isDark ? '#e2e8f0' : '#1e293b'
                            },
                            ticks: {
                                color: isDark ? '#e2e8f0' : '#1e293b'
                            },
                            grid: {
                                color: isDark ? 'rgba(226, 232, 240, 0.1)' : 'rgba(30, 41, 59, 0.1)'
                            }
                        },
                        y: { 
                            type: 'linear', 
                            display: true, 
                            position: 'left', 
                            title: { 
                                display: true, 
                                text: 'Velocidad (Mbps)',
                                color: isDark ? '#e2e8f0' : '#1e293b'
                            },
                            beginAtZero: true,
                            ticks: {
                                color: isDark ? '#e2e8f0' : '#1e293b'
                            },
                            grid: {
                                color: isDark ? 'rgba(226, 232, 240, 0.1)' : 'rgba(30, 41, 59, 0.1)'
                            }
                        },
                        y1: { 
                            type: 'linear', 
                            display: true, 
                            position: 'right', 
                            title: { 
                                display: true, 
                                text: 'Latencia (ms)',
                                color: isDark ? '#e2e8f0' : '#1e293b'
                            }, 
                            grid: { drawOnChartArea: false },
                            beginAtZero: true,
                            ticks: {
                                color: isDark ? '#e2e8f0' : '#1e293b'
                            }
                        },
                    }
                }
            });
        }
    }, [statusHistory]);

    const calculateUptime = () => {
        if (statusHistory.length === 0) return { percent: 100, hours: 24, minutes: 0 };
        
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        
        const onlineCount = statusHistory.filter(s => {
            const timestamp = new Date(s.timestamp.seconds * 1000);
            return timestamp >= oneDayAgo && s.status === 'OPERATIONAL';
        }).length;
        
        const totalChecks = statusHistory.filter(s => {
            const timestamp = new Date(s.timestamp.seconds * 1000);
            return timestamp >= oneDayAgo;
        }).length;
        
        const percent = totalChecks > 0 ? ((onlineCount / totalChecks) * 100).toFixed(2) : 100;
        const totalMinutes = totalChecks > 0 ? (onlineCount * 1) : 1440; // Assuming 1-minute intervals
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        return { percent, hours, minutes };
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPERATIONAL': return 'text-green-600';
            case 'OUTAGE': return 'text-red-600';
            case 'DEGRADED': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    const getSpeedQuality = (speed, type) => {
        if (type === 'download') {
            if (speed >= 100) return { quality: 'Excelente', color: 'text-green-600' };
            if (speed >= 50) return { quality: 'Buena', color: 'text-blue-600' };
            if (speed >= 25) return { quality: 'Aceptable', color: 'text-yellow-600' };
            return { quality: 'Baja', color: 'text-red-600' };
        } else {
            if (speed >= 20) return { quality: 'Excelente', color: 'text-green-600' };
            if (speed >= 10) return { quality: 'Buena', color: 'text-blue-600' };
            if (speed >= 5) return { quality: 'Aceptable', color: 'text-yellow-600' };
            return { quality: 'Baja', color: 'text-red-600' };
        }
    };

    const getLatencyQuality = (latency) => {
        if (latency <= 20) return { quality: 'Excelente', color: 'text-green-600' };
        if (latency <= 50) return { quality: 'Buena', color: 'text-blue-600' };
        if (latency <= 100) return { quality: 'Aceptable', color: 'text-yellow-600' };
        return { quality: 'Alta', color: 'text-red-600' };
    };

    const uptime = calculateUptime();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-600">Cargando estado de la red...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header with Reload Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Estado de la Red Starlink</h1>
                        <p className="text-gray-600">Monitoreo en tiempo real de la conexión a internet en Limón, Costa Rica</p>
                    </div>
                    <div className="flex justify-center sm:justify-end gap-4">
                        {/* Debug: Show current theme */}
                        <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm border border-gray-200">
                            <span className="text-gray-600">Tema: </span>
                            <span className="font-semibold text-gray-800">
                                {document.documentElement.classList.contains('dark') ? 'Oscuro' : 'Claro'}
                            </span>
                        </div>
                        {/* Theme Toggle Button */}
                        <button
                            onClick={() => {
                                const root = document.documentElement;
                                if (root.classList.contains('dark')) {
                                    root.classList.remove('dark');
                                    localStorage.setItem('theme', 'light');
                                } else {
                                    root.classList.add('dark');
                                    localStorage.setItem('theme', 'dark');
                                }
                            }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleReload}
                            disabled={isReloading}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                        >
                            {isReloading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Actualizar Datos
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Current Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Estado Actual</h2>
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full ${currentStatus?.status === 'OPERATIONAL' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={`font-bold text-xl ${getStatusColor(currentStatus?.status)}`}>
                                    {currentStatus?.status === 'OPERATIONAL' ? 'Operacional' : 
                                     currentStatus?.status === 'OUTAGE' ? 'Interrupción' : 
                                     currentStatus?.status === 'DEGRADED' ? 'Degradado' : 'Desconocido'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-sm">Última actualización</p>
                            <p className="font-semibold text-gray-800">
                                {currentStatus ? new Date(currentStatus.timestamp.seconds * 1000).toLocaleString('es-CR') : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Uptime and Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-gray-500 text-sm mb-2">Uptime (24h)</p>
                        <p className="text-3xl font-bold text-green-600">{uptime.percent}%</p>
                        <p className="text-sm text-gray-600">{uptime.hours}h {uptime.minutes}m</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-gray-500 text-sm mb-2">Velocidad de Descarga</p>
                        <p className="text-3xl font-bold text-blue-600">{currentStatus?.downloadSpeed || 0}</p>
                        <p className="text-sm text-gray-600">Mbps</p>
                        <p className={`text-xs font-medium ${getSpeedQuality(currentStatus?.downloadSpeed || 0, 'download').color}`}>
                            {getSpeedQuality(currentStatus?.downloadSpeed || 0, 'download').quality}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-gray-500 text-sm mb-2">Velocidad de Subida</p>
                        <p className="text-3xl font-bold text-green-600">{currentStatus?.uploadSpeed || 0}</p>
                        <p className="text-sm text-gray-600">Mbps</p>
                        <p className={`text-xs font-medium ${getSpeedQuality(currentStatus?.uploadSpeed || 0, 'upload').color}`}>
                            {getSpeedQuality(currentStatus?.uploadSpeed || 0, 'upload').quality}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-gray-500 text-sm mb-2">Latencia (Ping)</p>
                        <p className="text-3xl font-bold text-purple-600">{currentStatus?.latency || 0}</p>
                        <p className="text-sm text-gray-600">ms</p>
                        <p className={`text-xs font-medium ${getLatencyQuality(currentStatus?.latency || 0).color}`}>
                            {getLatencyQuality(currentStatus?.latency || 0).quality}
                        </p>
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Rendimiento de las Últimas 24 Horas</h3>
                    <div className="h-96">
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-500 text-sm">
                    <p>Esta página se actualiza automáticamente cada minuto</p>
                    <p>Use el botón "Actualizar Datos" para refrescar manualmente la información</p>
                    <p>Datos proporcionados por el sistema de monitoreo de Starlink</p>
                </div>
            </div>
        </div>
    );
};

export default NetworkStatusPage;