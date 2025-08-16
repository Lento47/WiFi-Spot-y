import React from 'react';
import { getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
const RoleBadge = ({ user, postAuthorEmail }) => {
    // Determine role based on props
    let role = 'User';
    let colorClass = 'bg-blue-100 text-blue-600 ring-blue-500/10';
    let icon = '👤';

    if (user?.role === 'admin' || postAuthorEmail === 'lejzer36@gmail.com') {
        role = 'Admin';
        colorClass = 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white ring-indigo-500/30 shadow-md';
        icon = '🛡️';
    } else if (user?.role === 'moderator') {
        role = 'Moderator';
        colorClass = 'bg-gradient-to-r from-green-400 to-teal-500 text-white ring-teal-500/30 shadow-md';
        icon = '🔧';
    }

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${colorClass} transition-all duration-300 hover:shadow-lg hover:scale-105`}>
            <span className="mr-1 text-sm">{icon}</span>
            {role}
        </span>
    );
};

export default RoleBadge;