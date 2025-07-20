import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase';
import Icon from '../common/Icon.jsx';

const Dashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        pending: 0,
        approved: 0,
        totalRevenue: 0,
        activeTokens: 0,
        usedTokens: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersQuery = query(collection(db, 'users'));
        const paymentsQuery = query(collection(db, 'payments'));
        const tokensQuery = query(collection(db, 'tokens'));

        const unsubUsers = onSnapshot(usersQuery, snapshot => {
            setStats(prev => ({ ...prev, users: snapshot.size }));
        });

        const unsubPayments = onSnapshot(paymentsQuery, snapshot => {
            let pendingCount = 0;
            let approvedCount = 0;
            let revenue = 0;
            snapshot.forEach(doc => {
                const payment = doc.data();
                if (payment.status === 'pending') pendingCount++;
                if (payment.status === 'approved') {
                    approvedCount++;
                    revenue += payment.price || 0;
                }
            });
            setStats(prev => ({ ...prev, pending: pendingCount, approved: approvedCount, totalRevenue: revenue }));
        });
        
        const unsubTokens = onSnapshot(tokensQuery, snapshot => {
            let activeCount = 0;
            let usedCount = 0;
            snapshot.forEach(doc => {
                const token = doc.data();
                if (token.status === 'active') activeCount++;
                if (token.status === 'used') usedCount++;
            });
            setStats(prev => ({ ...prev, activeTokens: activeCount, usedTokens: usedCount }));
        });
        
        setLoading(false);

        // Cleanup listeners on component unmount
        return () => {
            unsubUsers();
            unsubPayments();
            unsubTokens();
        };
    }, []);

    const StatCard = ({ title, value, icon, color, isCurrency = false }) => (
        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-5">
            <div className={`p-4 rounded-full ${color.bg}`}>{React.cloneElement(icon, { className: `w-8 h-8 ${color.text}` })}</div>
            <div>
                <p className="text-base text-slate-500 font-medium">{title}</p>
                {loading ? <div className="h-9 w-24 mt-1 bg-slate-200 rounded-md animate-pulse"></div> : 
                    <p className="text-4xl font-bold text-slate-800">
                        {isCurrency ? `₡${value.toLocaleString('es-CR')}` : value}
                    </p>
                }
            </div>
        </div>
    );

    return (
        <div>
            <h3 className="text-3xl font-bold text-slate-800 mb-6">Resumen General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard title="Ingresos Totales" value={stats.totalRevenue} icon={<Icon path="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V6.75m0 0A.75.75 0 012.25 6h.75M3.75 15h16.5m-16.5 0a9 9 0 013.75 2.101" />} color={{bg: 'bg-emerald-100', text: 'text-emerald-600'}} isCurrency={true} />
                <StatCard title="Usuarios Totales" value={stats.users} icon={<Icon path="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M15 12.5a5 5 0 11-10 0 5 5 0 0110 0z" />} color={{bg: 'bg-blue-100', text: 'text-blue-600'}} />
                <StatCard title="Pagos Pendientes" value={stats.pending} icon={<Icon path="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />} color={{bg: 'bg-orange-100', text: 'text-orange-600'}} />
                <StatCard title="Tokens Activos" value={stats.activeTokens} icon={<Icon path="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />} color={{bg: 'bg-sky-100', text: 'text-sky-600'}} />
                <StatCard title="Tokens Usados" value={stats.usedTokens} icon={<Icon path="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />} color={{bg: 'bg-slate-100', text: 'text-slate-600'}} />
                <StatCard title="Pagos Aprobados" value={stats.approved} icon={<Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} color={{bg: 'bg-green-100', text: 'text-green-600'}} />
            </div>
        </div>
    );
};

export default Dashboard;
