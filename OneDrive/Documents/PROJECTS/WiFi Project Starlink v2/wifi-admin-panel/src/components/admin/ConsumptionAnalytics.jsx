import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { FiBarChart, FiClock, FiWifi, FiTrendingUp, FiTrendingDown, FiCalendar, FiUsers, FiRefreshCw, FiDatabase } from 'react-icons/fi';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
} from 'chart.js';

// Register Chart.js components only once
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement
);

const ConsumptionAnalytics = memo(() => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d
    const [selectedUser, setSelectedUser] = useState('');
    const [users, setUsers] = useState([]);

    // Memoize Firebase functions to prevent recreation
    const functions = useMemo(() => getFunctions(), []);
    
    // Memoize function calls
    const getConsumptionAnalytics = useMemo(() => 
        httpsCallable(functions, 'getConsumptionAnalytics'), 
        [functions]
    );
    
    const createSampleTokenUsage = useMemo(() => 
        httpsCallable(functions, 'createSampleTokenUsage'), 
        [functions]
    );

    // Memoize users to prevent unnecessary re-renders
    const memoizedUsers = useMemo(() => users, [users]);

    // Memoize fetch functions to prevent recreation
    const fetchUsers = useCallback(async () => {
        try {
            // For now, we'll use a simple approach - you can enhance this later
            setUsers([
                { id: 'all', displayName: 'Todos los usuarios', email: 'all@example.com' }
            ]);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        }
    }, []);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            // Check if we're in development mode and should use emulators
            if (import.meta.env.DEV) {
                console.log('Development mode detected, checking for emulator connection...');
                // You can manually set this to true if emulators are running
                const useEmulator = false; // Set to true when emulators are running
                
                if (useEmulator) {
                    functions.useEmulator('localhost', 5001);
                    console.log('Using Firebase Functions emulator');
                }
            }
            
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30); // Last 30 days
            
            const result = await getConsumptionAnalytics({
                startDate: startDate.toISOString(),
                endDate: new Date().toISOString(),
                userId: selectedUser || null
            });

            console.log('Analytics result:', result);
            
            if (result.data && result.data.success) {
                setAnalytics(result.data.analytics);
            } else {
                console.log('No analytics data returned, using mock data');
                setAnalytics(createMockAnalytics());
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            // For demo purposes, create mock data
            setAnalytics(createMockAnalytics());
        } finally {
            setLoading(false);
        }
    }, [getConsumptionAnalytics, selectedUser, functions]);

    // Memoize mock analytics creation
    const createMockAnalytics = useCallback(() => {
        // Mock data for demonstration
        const hourlyUsage = {};
        const dailyUsage = {};
        
        // Generate mock hourly data
        for (let i = 0; i < 24; i++) {
            hourlyUsage[i] = Math.random() * 50 + 10; // Random GB between 10-60
        }
        
        // Generate mock daily data
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        days.forEach(day => {
            dailyUsage[day] = Math.random() * 200 + 50; // Random GB between 50-250
        });

        return {
            totalGbConsumed: 1250.5,
            totalSessions: 89,
            averageSessionGb: 14.05,
            hourlyUsage,
            dailyUsage,
            usageData: []
        };
    }, []);

    // Memoize chart data to prevent unnecessary re-renders
    const hourlyChartData = useMemo(() => {
        if (!analytics?.hourlyUsage) return null;

        const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const data = Array.from({ length: 24 }, (_, i) => analytics.hourlyUsage[i] || 0);

        return {
            labels,
            datasets: [
                {
                    label: 'GB Consumidos por Hora',
                    data,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        };
    }, [analytics?.hourlyUsage]);

    const dailyChartData = useMemo(() => {
        if (!analytics?.dailyUsage) return null;

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const data = days.map(day => analytics.dailyUsage[day] || 0);

        return {
            labels: days.map(day => day.slice(0, 3)),
            datasets: [
                {
                    label: 'GB Consumidos por Día',
                    data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(199, 199, 199, 0.8)'
                    ],
                    borderWidth: 2
                }
            ]
        };
    }, [analytics?.dailyUsage]);

    const consumptionDistributionData = useMemo(() => {
        if (!analytics) return null;

        const { totalGbConsumed, totalSessions } = analytics;
        const avgPerSession = totalSessions > 0 ? totalGbConsumed / totalSessions : 0;

        return {
            labels: ['Promedio por Sesión', 'Total Consumido'],
            datasets: [
                {
                    data: [avgPerSession, totalGbConsumed],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(59, 130, 246, 0.8)'
                    ],
                    borderWidth: 2
                }
            ]
        };
    }, [analytics]);

    // Memoize insights data
    const insightsData = useMemo(() => {
        if (!analytics) return { peakHours: 'No hay datos disponibles', peakDays: 'No hay datos disponibles' };

        const peakHours = analytics.hourlyUsage ? 
            Object.entries(analytics.hourlyUsage)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([hour, gb]) => `${hour}:00 (${gb.toFixed(1)} GB)`)
                .join(', ')
            : 'No hay datos disponibles';

        const peakDays = analytics.dailyUsage ? 
            Object.entries(analytics.dailyUsage)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([day, gb]) => `${day} (${gb.toFixed(1)} GB)`)
                .join(', ')
            : 'No hay datos disponibles';

        return { peakHours, peakDays };
    }, [analytics]);

    // Memoize handlers
    const handleDateRangeChange = useCallback((e) => {
        setDateRange(e.target.value);
    }, []);

    const handleUserChange = useCallback((e) => {
        setSelectedUser(e.target.value === 'all' ? '' : e.target.value);
    }, []);

    const handleCreateSampleData = useCallback(async () => {
        try {
            const result = await createSampleTokenUsage();
            
            if (result.data.success) {
                alert(`Se crearon ${result.data.createdCount} registros de muestra para ${result.data.userCount} usuarios`);
                fetchAnalytics(); // Refresh analytics
            } else {
                alert('Error al crear datos de muestra');
            }
        } catch (error) {
            console.error('Error creating sample data:', error);
            alert('Error al crear datos de muestra');
        }
    }, [createSampleTokenUsage, fetchAnalytics]);

    useEffect(() => {
        fetchAnalytics();
        fetchUsers();
    }, [fetchAnalytics, fetchUsers]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Analytics de Consumo</h2>
                    <p className="text-gray-600 dark:text-gray-400">Análisis de patrones de uso de tokens y consumo de GB</p>
                </div>
                
                {/* Filters */}
                <div className="flex gap-3 mb-6">
                    <select
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                        <option value="90d">Últimos 90 días</option>
                    </select>
                    
                    <select
                        value={selectedUser || 'all'}
                        onChange={handleUserChange}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Todos los usuarios</option>
                        {memoizedUsers.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.displayName || user.email}
                            </option>
                        ))}
                    </select>
                    
                    <motion.button
                        onClick={fetchAnalytics}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </motion.button>
                    
                    <motion.button
                        onClick={handleCreateSampleData}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <FiDatabase className="w-4 h-4" />
                        Crear Datos de Muestra
                    </motion.button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total GB Consumidos</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {analytics?.totalGbConsumed?.toFixed(1) || '0'} GB
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <FiWifi className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sesiones</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {analytics?.totalSessions || '0'}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <FiUsers className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio por Sesión</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {analytics?.averageSessionGb?.toFixed(1) || '0'} GB
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                            <FiBarChart className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Período</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {dateRange === '7d' ? '7 días' : dateRange === '30d' ? '30 días' : '90 días'}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                            <FiCalendar className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Usage Chart */}
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                    whileHover={{ scale: 1.01 }}
                >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <FiClock className="w-5 h-5 text-blue-600" />
                        Consumo por Hora del Día
                    </h3>
                    {hourlyChartData && (
                        <Line 
                            data={hourlyChartData} 
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    title: {
                                        display: true,
                                        text: 'Patrón de uso por hora'
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        title: {
                                            display: true,
                                            text: 'GB Consumidos'
                                        }
                                    }
                                }
                            }}
                        />
                    )}
                </motion.div>

                {/* Daily Usage Chart */}
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                    whileHover={{ scale: 1.01 }}
                >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <FiCalendar className="w-5 h-5 text-green-600" />
                        Consumo por Día de la Semana
                    </h3>
                    {dailyChartData && (
                        <Bar 
                            data={dailyChartData} 
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    title: {
                                        display: true,
                                        text: 'Patrón de uso por día'
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        title: {
                                            display: true,
                                            text: 'GB Consumidos'
                                        }
                                    }
                                }
                            }}
                        />
                    )}
                </motion.div>
            </div>

            {/* Distribution Chart */}
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                whileHover={{ scale: 1.01 }}
            >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FiTrendingUp className="w-5 h-5 text-purple-600" />
                    Distribución del Consumo
                </h3>
                <div className="flex justify-center">
                    <div className="w-64 h-64">
                        {consumptionDistributionData && (
                            <Doughnut 
                                data={consumptionDistributionData} 
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                        },
                                        title: {
                                            display: true,
                                            text: 'Comparación de consumo'
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Insights */}
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                whileHover={{ scale: 1.01 }}
            >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FiTrendingUp className="w-5 h-5 text-green-600" />
                    Insights del Consumo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-800 dark:text-white mb-2">Horas Pico de Uso</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                            {insightsData.peakHours}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-800 dark:text-white mb-2">Días de Mayor Consumo</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                            {insightsData.peakDays}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});

ConsumptionAnalytics.displayName = 'ConsumptionAnalytics';

export default ConsumptionAnalytics;
