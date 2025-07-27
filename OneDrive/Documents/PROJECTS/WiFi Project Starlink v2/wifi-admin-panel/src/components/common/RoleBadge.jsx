import React from 'react';
import Icon from './Icon.jsx';

const RoleBadge = ({ user, postAuthorEmail }) => {
    // Determine if the user is an admin based on their email
    const emailToCheck = user?.email || postAuthorEmail;
    const isAdmin = emailToCheck === 'lejzer36@gmail.com';

    if (isAdmin) {
        // This is a Twitter-style "Verified" checkmark badge for admins
        return (
            <span title="Administrador" className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39-.2-2.9-.81-3.64-.61-.75-1.94-1.11-3.41-1.23a25.84 25.84 0 00-3.84-.29 25.75 25.75 0 00-3.84.29c-1.47.12-2.8.48-3.41 1.23-.61.74-1.27 2.25-.81 3.64C2.88 9.33 2 10.57 2 12c0 1.43.88 2.67 2.19 3.34-.46 1.39.2 2.9.81 3.64.61.75 1.94 1.11 3.41 1.23a25.94 25.94 0 003.84.29 25.86 25.86 0 003.84-.29c1.47-.12 2.8-.48 3.41-1.23.61-.74 1.27-2.25-.81-3.64C21.12 14.67 22 13.43 22 12z" stroke="none"></path>
                    <path fill="#fff" d="M9.75 14.99l-2.47-2.47a.75.75 0 00-1.06 1.06l3 3c.29.29.77.29 1.06 0l6.5-6.5a.75.75 0 00-1.06-1.06L9.75 14.99z"></path>
                </svg>
            </span>
        );
    }

    // For regular users, we don't show a badge to keep the UI clean
    return null; 
};

export default RoleBadge;