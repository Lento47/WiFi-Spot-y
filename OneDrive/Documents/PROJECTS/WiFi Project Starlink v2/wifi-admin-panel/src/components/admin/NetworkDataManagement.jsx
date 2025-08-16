import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, deleteDoc, doc, addDoc, serverTimestamp, where, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Icon from '../common/Icon.jsx';

const NetworkDataManagement = () => {
    const [user, loading] = useAuthState(auth);
    const [dataStats, setDataStats] = useState({
        totalRecords: 0,
        detailedRecords: 0,
        hourlyRecords: 0,
        dailyRecords: 0,
        storageSize: '0 KB',
        estimatedCost: '$0.00'
    });
    const [retentionSettings, setRetentionSettings] = useState({
        detailedDataDays: 7,
        hourlyDataDays: 30,
        dailyDataDays: 365,
        autoCleanup: true,
        compressionEnabled: true
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [lastCompaction, setLastCompaction] = useState(null);

    useEffect(() => {
        fetchDataStats();
        fetchLastCompaction();
    }, []);

    const fetchDataStats = async () => {
        try {
            // Get detailed records count
            const detailedQuery = query(collection(db, 'networkStatus'), orderBy('timestamp', 'desc'));
            const detailedSnapshot = await getDocs(detailedQuery);
            
            // Get hourly records count
            const hourlyQuery = query(collection(db, 'networkStatusHourly'), orderBy('timestamp', 'desc'));
            const hourlySnapshot = await getDocs(hourlyQuery);
            
            // Get daily records count
            const dailyQuery = query(collection(db, 'networkStatusDaily'), orderBy('timestamp', 'desc'));
            const dailySnapshot = await getDocs(dailyQuery);

            const totalRecords = detailedSnapshot.size + hourlySnapshot.size + dailySnapshot.size;
            
            // Estimate storage size (rough calculation)
            const avgRecordSize = 500; // bytes per record
            const storageSizeBytes = totalRecords * avgRecordSize;
            const storageSize = formatBytes(storageSizeBytes);
            
            // Estimate monthly cost (Firestore pricing: $0.18 per GB stored + $0.06 per 100K reads)
            const storageGB = storageSizeBytes / (1024 * 1024 * 1024);
            const estimatedCost = (storageGB * 0.18).toFixed(2);

            setDataStats({
                totalRecords,
                detailedRecords: detailedSnapshot.size,
                hourlyRecords: hourlySnapshot.size,
                dailyRecords: dailySnapshot.size,
                storageSize,
                estimatedCost: `$${estimatedCost}`
            });
        } catch (error) {
            console.error('Error fetching data stats:', error);
        }
    };

    const fetchLastCompaction = async () => {
        try {
            const compactionQuery = query(
                collection(db, 'systemLogs'),
                where('type', '==', 'data_compaction'),
                orderBy('timestamp', 'desc'),
                limit(1)
            );
            const snapshot = await getDocs(compactionQuery);
            if (!snapshot.empty) {
                setLastCompaction(snapshot.docs[0].data().timestamp.toDate());
            }
        } catch (error) {
            console.error('Error fetching last compaction:', error);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const aggregateHourlyData = async (startDate, endDate) => {
        const hourlyData = {};
        
        // Group detailed data by hour
        const detailedQuery = query(
            collection(db, 'networkStatus'),
            where('timestamp', '>=', startDate),
            where('timestamp', '<=', endDate),
            orderBy('timestamp', 'asc')
        );
        
        const snapshot = await getDocs(detailedQuery);
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const timestamp = data.timestamp.toDate();
            const hourKey = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate(), timestamp.getHours());
            
            if (!hourlyData[hourKey.getTime()]) {
                hourlyData[hourKey.getTime()] = {
                    readings: [],
                    timestamp: hourKey
                };
            }
            
            hourlyData[hourKey.getTime()].readings.push(data);
        });

        // Calculate hourly averages
        const hourlyAverages = Object.values(hourlyData).map(hour => {
            const readings = hour.readings;
            const avgDownload = readings.reduce((sum, r) => sum + (r.downloadSpeed || 0), 0) / readings.length;
            const avgUpload = readings.reduce((sum, r) => sum + (r.uploadSpeed || 0), 0) / readings.length;
            const avgLatency = readings.reduce((sum, r) => sum + (r.latency || 0), 0) / readings.length;
            const avgPacketLoss = readings.reduce((sum, r) => sum + (r.packetLoss || 0), 0) / readings.length;
            const avgJitter = readings.reduce((sum, r) => sum + (r.jitter || 0), 0) / readings.length;
            
            // Determine status based on majority of readings
            const statusCounts = readings.reduce((counts, r) => {
                counts[r.status] = (counts[r.status] || 0) + 1;
                return counts;
            }, {});
            const status = Object.entries(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);

            return {
                timestamp: hour.timestamp,
                status: status,
                downloadSpeed: Math.round(avgDownload * 100) / 100,
                uploadSpeed: Math.round(avgUpload * 100) / 100,
                latency: Math.round(avgLatency * 100) / 100,
                packetLoss: Math.round(avgPacketLoss * 100) / 100,
                jitter: Math.round(avgJitter * 100) / 100,
                readingCount: readings.length,
                aggregatedAt: serverTimestamp()
            };
        });

        return hourlyAverages;
    };

    const aggregateDailyData = async (startDate, endDate) => {
        const dailyData = {};
        
        // Group hourly data by day
        const hourlyQuery = query(
            collection(db, 'networkStatusHourly'),
            where('timestamp', '>=', startDate),
            where('timestamp', '<=', endDate),
            orderBy('timestamp', 'asc')
        );
        
        const snapshot = await getDocs(hourlyQuery);
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const timestamp = data.timestamp.toDate();
            const dayKey = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
            
            if (!dailyData[dayKey.getTime()]) {
                dailyData[dayKey.getTime()] = {
                    readings: [],
                    timestamp: dayKey
                };
            }
            
            dailyData[dayKey.getTime()].readings.push(data);
        });

        // Calculate daily averages
        const dailyAverages = Object.values(dailyData).map(day => {
            const readings = day.readings;
            const avgDownload = readings.reduce((sum, r) => sum + (r.downloadSpeed || 0), 0) / readings.length;
            const avgUpload = readings.reduce((sum, r) => sum + (r.uploadSpeed || 0), 0) / readings.length;
            const avgLatency = readings.reduce((sum, r) => sum + (r.latency || 0), 0) / readings.length;
            const avgPacketLoss = readings.reduce((sum, r) => sum + (r.packetLoss || 0), 0) / readings.length;
            const avgJitter = readings.reduce((sum, r) => sum + (r.jitter || 0), 0) / readings.length;
            
            // Calculate uptime percentage
            const operationalCount = readings.filter(r => r.status === 'OPERATIONAL').length;
            const uptimePercent = (operationalCount / readings.length) * 100;
            
            // Determine status based on uptime
            let status = 'OPERATIONAL';
            if (uptimePercent < 50) status = 'OUTAGE';
            else if (uptimePercent < 90) status = 'DEGRADED';

            return {
                timestamp: day.timestamp,
                status: status,
                downloadSpeed: Math.round(avgDownload * 100) / 100,
                uploadSpeed: Math.round(avgUpload * 100) / 100,
                latency: Math.round(avgLatency * 100) / 100,
                packetLoss: Math.round(avgPacketLoss * 100) / 100,
                jitter: Math.round(avgJitter * 100) / 100,
                uptimePercent: Math.round(uptimePercent * 100) / 100,
                readingCount: readings.length,
                aggregatedAt: serverTimestamp()
            };
        });

        return dailyAverages;
    };

    const cleanupOldData = async () => {
        const now = new Date();
        
        // Clean up old detailed data
        const detailedCutoff = new Date(now.getTime() - (retentionSettings.detailedDataDays * 24 * 60 * 60 * 1000));
        const oldDetailedQuery = query(
            collection(db, 'networkStatus'),
            where('timestamp', '<', detailedCutoff),
            orderBy('timestamp', 'asc'),
            limit(1000) // Process in batches
        );
        
        const detailedSnapshot = await getDocs(oldDetailedQuery);
        const detailedDeletions = detailedSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(detailedDeletions);
        
        // Clean up old hourly data
        const hourlyCutoff = new Date(now.getTime() - (retentionSettings.hourlyDataDays * 24 * 60 * 60 * 1000));
        const oldHourlyQuery = query(
            collection(db, 'networkStatusHourly'),
            where('timestamp', '<', hourlyCutoff),
            orderBy('timestamp', 'asc'),
            limit(1000)
        );
        
        const hourlySnapshot = await getDocs(oldHourlyQuery);
        const hourlyDeletions = hourlySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(hourlyDeletions);
        
        // Clean up old daily data
        const dailyCutoff = new Date(now.getTime() - (retentionSettings.dailyDataDays * 24 * 60 * 60 * 1000));
        const oldDailyQuery = query(
            collection(db, 'networkStatusDaily'),
            where('timestamp', '<', dailyCutoff),
            orderBy('timestamp', 'asc'),
            limit(1000)
        );
        
        const dailySnapshot = await getDocs(oldDailyQuery);
        const dailyDeletions = dailySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(dailyDeletions);
    };

    const runDataCompaction = async () => {
        // Check if user is authenticated and is admin
        console.log('Current user:', user);
        console.log('User email:', user?.email);
        console.log('User UID:', user?.uid);
        console.log('Is admin check:', user?.email === 'lejzer36@gmail.com');
        
        // Get the user's ID token to check authentication
        try {
            const token = await user?.getIdToken();
            console.log('User ID token:', token ? 'Token exists' : 'No token');
            
            // Also check if the user is in the users collection as an admin
            if (user?.uid) {
                const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', 'lejzer36@gmail.com')));
                console.log('Admin user doc found:', !userDoc.empty);
                if (!userDoc.empty) {
                    const adminData = userDoc.docs[0].data();
                    console.log('Admin user data:', adminData);
                }
            }
        } catch (error) {
            console.error('Error getting ID token:', error);
        }
        
        // Check if user is admin by looking in the users collection
        if (!user) {
            alert('Usuario no autenticado.');
            return;
        }
        
        // Check if user is admin by email or by checking the users collection
        const isAdmin = user.email === 'lejzer36@gmail.com' || 
                       user.email === 'lejzer36@pm.me' || 
                       user.email === 'lejzerv@gmail.com';
        
        if (!isAdmin) {
            alert('Solo los administradores pueden ejecutar la compactación de datos.');
            return;
        }
        
        setIsProcessing(true);
        setProcessingProgress(0);
        
        try {
            const now = new Date();
            
            // Test write permission first
            console.log('Testing write permission...');
            try {
                const testDoc = await addDoc(collection(db, 'systemLogs'), {
                    type: 'test_write',
                    timestamp: serverTimestamp(),
                    message: 'Testing write permission for data compaction'
                });
                console.log('Test write successful, doc ID:', testDoc.id);
                
                // Clean up test document
                await deleteDoc(doc(db, 'systemLogs', testDoc.id));
                console.log('Test document cleaned up');
            } catch (testError) {
                console.error('Test write failed:', testError);
                throw new Error(`Write permission test failed: ${testError.message}`);
            }
            
            // Step 1: Aggregate detailed data to hourly (last 7 days)
            setProcessingProgress(20);
            const detailedStartDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            const hourlyData = await aggregateHourlyData(detailedStartDate, now);
            
            // Save hourly data
            setProcessingProgress(40);
            const hourlyPromises = hourlyData.map(data => 
                addDoc(collection(db, 'networkStatusHourly'), data)
            );
            await Promise.all(hourlyPromises);
            
            // Step 2: Aggregate hourly data to daily (last 30 days)
            setProcessingProgress(60);
            const hourlyStartDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            const dailyData = await aggregateDailyData(hourlyStartDate, now);
            
            // Save daily data
            setProcessingProgress(80);
            const dailyPromises = dailyData.map(data => 
                addDoc(collection(db, 'networkStatusDaily'), data)
            );
            await Promise.all(dailyPromises);
            
            // Step 3: Clean up old data
            setProcessingProgress(90);
            if (retentionSettings.autoCleanup) {
                await cleanupOldData();
            }
            
            // Log the compaction
            await addDoc(collection(db, 'systemLogs'), {
                type: 'data_compaction',
                timestamp: serverTimestamp(),
                details: {
                    hourlyRecordsCreated: hourlyData.length,
                    dailyRecordsCreated: dailyData.length,
                    retentionSettings: retentionSettings
                }
            });
            
            setProcessingProgress(100);
            setLastCompaction(now);
            
            // Refresh stats
            setTimeout(() => {
                fetchDataStats();
                setIsProcessing(false);
                setProcessingProgress(0);
            }, 2000);
            
        } catch (error) {
            console.error('Error during data compaction:', error);
            alert('Error durante la compactación de datos. Por favor intente nuevamente.');
            setIsProcessing(false);
            setProcessingProgress(0);
        }
    };

    const updateRetentionSettings = async () => {
        // Check if user is authenticated and is admin
        if (!user) {
            alert('Usuario no autenticado.');
            return;
        }
        
        const isAdmin = user.email === 'lejzer36@gmail.com' || 
                       user.email === 'lejzer36@pm.me' || 
                       user.email === 'lejzerv@gmail.com';
        
        if (!isAdmin) {
            alert('Solo los administradores pueden actualizar la configuración.');
            return;
        }
        
        try {
            await addDoc(collection(db, 'systemSettings'), {
                type: 'networkDataRetention',
                settings: retentionSettings,
                updatedAt: serverTimestamp()
            });
            alert('Configuración de retención actualizada correctamente.');
        } catch (error) {
            console.error('Error updating retention settings:', error);
            alert('Error al actualizar la configuración.');
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Check if user is admin
    if (!user) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Usuario No Autenticado</h2>
                <p className="text-gray-600">Debe iniciar sesión para acceder a esta página.</p>
            </div>
        );
    }
    
    const isAdmin = user.email === 'lejzer36@gmail.com' || 
                   user.email === 'lejzer36@pm.me' || 
                   user.email === 'lejzerv@gmail.com';
    
    if (!isAdmin) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
                <p className="text-gray-600">Solo los administradores pueden acceder a esta página.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <Icon path="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                            Gestión de Datos de Red
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Optimice el almacenamiento y reduzca costos de Firebase mediante compactación inteligente de datos
                        </p>
                    </div>
                </div>
            </div>

            {/* Data Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Registros</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{dataStats.totalRecords.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <Icon path="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tamaño de Almacenamiento</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{dataStats.storageSize}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <Icon path="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Costo Estimado/Mes</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{dataStats.estimatedCost}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <Icon path="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Breakdown */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    Desglose de Datos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dataStats.detailedRecords.toLocaleString()}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Registros Detallados</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Lecturas por minuto</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{dataStats.hourlyRecords.toLocaleString()}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Registros por Hora</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Promedios agregados</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{dataStats.dailyRecords.toLocaleString()}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Registros Diarios</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Resúmenes diarios</p>
                    </div>
                </div>
            </div>

            {/* Retention Settings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">
                    Configuración de Retención
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Datos Detallados (días)
                        </label>
                        <input
                            type="number"
                            value={retentionSettings.detailedDataDays}
                            onChange={(e) => setRetentionSettings(prev => ({ ...prev, detailedDataDays: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                            max="30"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Mantener lecturas por minuto durante X días
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Datos por Hora (días)
                        </label>
                        <input
                            type="number"
                            value={retentionSettings.hourlyDataDays}
                            onChange={(e) => setRetentionSettings(prev => ({ ...prev, hourlyDataDays: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="7"
                            max="90"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Mantener promedios por hora durante X días
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Datos Diarios (días)
                        </label>
                        <input
                            type="number"
                            value={retentionSettings.dailyDataDays}
                            onChange={(e) => setRetentionSettings(prev => ({ ...prev, dailyDataDays: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="30"
                            max="1095"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Mantener resúmenes diarios durante X días
                        </p>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={retentionSettings.autoCleanup}
                                onChange={(e) => setRetentionSettings(prev => ({ ...prev, autoCleanup: e.target.checked }))}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Limpieza Automática
                            </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={retentionSettings.compressionEnabled}
                                onChange={(e) => setRetentionSettings(prev => ({ ...prev, compressionEnabled: e.target.checked }))}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Compresión Habilitada
                            </span>
                        </label>
                    </div>
                </div>
                <div className="mt-6">
                    <button
                        onClick={updateRetentionSettings}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        Guardar Configuración
                    </button>
                </div>
            </div>

            {/* Data Compaction */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                            Compactación de Datos
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {lastCompaction ? (
                                `Última compactación: ${lastCompaction.toLocaleString('es-CR')}`
                            ) : (
                                'No se ha ejecutado ninguna compactación'
                            )}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            La compactación reduce el número de documentos y optimiza el almacenamiento
                        </p>
                    </div>
                    <button
                        onClick={runDataCompaction}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                    >
                        {isProcessing ? (
                            <>
                                <Icon path="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" className="w-5 h-5 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" className="w-5 h-5" />
                                Ejecutar Compactación
                            </>
                        )}
                    </button>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                    <div className="mt-6">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-3">
                            <div 
                                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${processingProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Progreso: {processingProgress}%
                        </p>
                    </div>
                )}
            </div>

            {/* Cost Savings Info */}
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
                    💰 Ahorros de Costos Estimados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700 dark:text-green-300">
                    <div>
                        <p className="font-medium">Antes de la compactación:</p>
                        <ul className="mt-2 space-y-1">
                            <li>• 1,440 documentos por día (lecturas por minuto)</li>
                            <li>• ~43,200 documentos por mes</li>
                            <li>• Costo estimado: $0.50-1.00/mes</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-medium">Después de la compactación:</p>
                        <ul className="mt-2 space-y-1">
                            <li>• 24 documentos por día (lecturas por hora)</li>
                            <li>• ~720 documentos por mes</li>
                            <li>• Costo estimado: $0.05-0.10/mes</li>
                        </ul>
                    </div>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-4">
                    <strong>Ahorro estimado: 80-90% en costos de almacenamiento</strong>
                </p>
            </div>
        </div>
    );
};

export default NetworkDataManagement;
