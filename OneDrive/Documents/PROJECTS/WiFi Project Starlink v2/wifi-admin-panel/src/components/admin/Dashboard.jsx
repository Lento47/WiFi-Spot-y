import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Icon } from '../common/Icon';

const Dashboard = ({ db }) => {
    const [stats, setStats] = useState({ users: 0, pending: 0, approved: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const fetchStats = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const paymentsSnapshot = await getDocs(collection(db, 'payments'));
                let pendingCount = 0, approvedCount = 0;
                paymentsSnapshot.forEach(doc => {
                    const status = doc.data().status;
                    if (status === 'pending') pendingCount++;
                    if (status === 'approved') approvedCount++;
                });
                setStats({ users: usersSnapshot.size, pending: pendingCount, approved: approvedCount });
            } catch (error) { console.error("Error fetching stats:", error); } 
            finally { setLoading(false); }
        };
        fetchStats();
    }, [db]);

    const StatCard = ({ title, value, icon, color }) => (
        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-5">
            <div className={`p-4 rounded-full ${color.bg}`}>{React.cloneElement(icon, { className: `w-8 h-8 ${color.text}` })}</div>
            <div>
                <p className="text-base text-slate-500 font-medium">{title}</p>
                {loading ? <div className="h-9 w-12 mt-1 bg-slate-200 rounded-md animate-pulse"></div> : <p className="text-4xl font-bold text-slate-800">{value}</p>}
            </div>
        </div>
    );

    return (
        <div>
            <h3 className="text-3xl font-bold text-slate-800 mb-6">Resumen General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard title="Usuarios Totales" value={stats.users} icon={<Icon path="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M15 12.5a5 5 0 11-10 0 5 5 0 0110 0z" />} color={{bg: 'bg-blue-100', text: 'text-blue-600'}} />
                <StatCard title="Pagos Pendientes" value={stats.pending} icon={<Icon path="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />} color={{bg: 'bg-orange-100', text: 'text-orange-600'}} />
                <StatCard title="Pagos Aprobados" value={stats.approved} icon={<Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} color={{bg: 'bg-green-100', text: 'text-green-600'}} />
            </div>
        </div>
    );
};

export default Dashboard;
