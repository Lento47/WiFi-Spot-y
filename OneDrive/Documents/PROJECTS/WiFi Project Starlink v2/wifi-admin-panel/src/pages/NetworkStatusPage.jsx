import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Chart from 'chart.js/auto';

const NetworkStatusPage = () => {
    const [statusHistory, setStatusHistory] = useState([]);
    const [currentStatus, setCurrentStatus] = useState(null);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        const q = query(collection(db, "networkStatus"), orderBy("timestamp", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStatusHistory(history);
            if (history.length > 0) {
                setCurrentStatus(history[0]);
            }
        });

        return () => unsubscribe();
    }, []);

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
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Descarga (Mbps)', data: downloadData, borderColor: 'rgb(59, 130, 246)', tension: 0.1, yAxisID: 'y' },
                        { label: 'Subida (Mbps)', data: uploadData, borderColor: 'rgb(34, 197, 94)', tension: 0.1, yAxisID: 'y' },
                        { label: 'Latencia (ms)', data: latencyData, borderColor: 'rgb(239, 68, 68)', tension: 0.1, yAxisID: 'y1' },
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Velocidad (Mbps)' } },
                        y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Latencia (ms)' }, grid: { drawOnChartArea: false } },
                    }
                }
            });
        }
    }, [statusHistory]);

    const uptimePercent = () => {
        if (statusHistory.length === 0) return 100;
        const onlineCount = statusHistory.filter(s => s.status === 'OPERATIONAL').length;
        return ((onlineCount / statusHistory.length) * 100).toFixed(2);
    };

    const StatusIndicator = ({ status }) => {
        const config = {
            OPERATIONAL: { text: "Operacional", color: "bg-green-500" },
            OUTAGE: { text: "Interrupción", color: "bg-red-500" },
        };
        const current = config[status] || { text: "Desconocido", color: "bg-gray-500" };
        return <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full ${current.color}`}></div><span className="font-bold text-lg">{current.text}</span></div>;
    };

    return (
        <div className="bg-slate-50 min-h-screen p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold text-slate-800 text-center mb-2">Estado de la Red</h1>
                <p className="text-center text-slate-500 mb-8">Estado en tiempo real de la conexión a internet en Limón.</p>
                
                <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                    {currentStatus ? <StatusIndicator status={currentStatus.status} /> : <p>Cargando estado...</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg text-center"><p className="text-slate-500">Velocidad de Descarga</p><p className="text-4xl font-bold">{currentStatus?.downloadSpeed || 0} <span className="text-xl">Mbps</span></p></div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg text-center"><p className="text-slate-500">Velocidad de Subida</p><p className="text-4xl font-bold">{currentStatus?.uploadSpeed || 0} <span className="text-xl">Mbps</span></p></div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg text-center"><p className="text-slate-500">Latencia (Ping)</p><p className="text-4xl font-bold">{currentStatus?.latency || 0} <span className="text-xl">ms</span></p></div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Historial de las Últimas 24 Horas</h3>
                    <p className="text-sm text-slate-500 mb-4">Uptime: <span className="font-bold">{uptimePercent()}%</span></p>
                    <div className="h-96"><canvas ref={chartRef}></canvas></div>
                </div>
            </div>
        </div>
    );
};

export default NetworkStatusPage;