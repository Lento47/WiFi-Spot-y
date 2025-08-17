import React, { useState, useEffect, useRef } from 'react';
// Corrected import: Added getDoc and updateDoc to the list
import { collection, onSnapshot, addDoc, query, orderBy, serverTimestamp, getDocs, deleteDoc, doc, where, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import Spinner from '../common/Spinner.jsx';
import RoleBadge from '../common/RoleBadge.jsx';

// --- Component to render posts with clickable tags ---
const PostRenderer = ({ text, topics, onTopicClick }) => {
    const regex = /(@[a-zA-Z0-9_]+)|(#[a-zA-Z0-9_]+)/g;
    const parts = text.split(regex).filter(Boolean);

    const findTopicByName = (name) => {
        return topics.find(t => t.name.toLowerCase() === name.substring(1).toLowerCase());
    };

    return (
        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {parts.map((part, index) => {
                if (part.startsWith('@')) {
                    return <strong key={index} className="text-blue-500">{part}</strong>;
                }
                if (part.startsWith('#')) {
                    const topic = findTopicByName(part);
                    if (topic) {
                        return (
                            <button key={index} onClick={() => onTopicClick(topic)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                {part}
                            </button>
                        );
                    }
                }
                return <span key={index}>{part}</span>;
            })}
        </p>
    );
};


const BulletinBoard = ({ user, isAdmin = false }) => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [censoredWords, setCensoredWords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState({ id: 'general', name: 'General', logo: '📢' });
    const [punishmentMinutes, setPunishmentMinutes] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [showOpenOnly, setShowOpenOnly] = useState(false);
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStart, setMentionStart] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        getDocs(collection(db, 'censoredWords')).then(s => setCensoredWords(s.docs.map(d => d.data().word)));
        // Fetch channels from muralChannels collection (admin-created channels)
        onSnapshot(query(collection(db, 'muralChannels'), orderBy('name')), s => {
            const channelsData = s.docs.map(d => ({ 
                id: d.id, 
                ...d.data(),
                // Map admin channel data to expected format
                logo: d.data().logo || '📢',
                isOpen: d.data().isActive !== false,
                canWrite: d.data().allowedRoles?.includes('user') || d.data().allowedRoles?.includes('admin')
            }));
            setTopics(channelsData);
        });
        onSnapshot(doc(db, 'config', 'punishments'), doc => setPunishmentMinutes(doc.data()?.penaltyMinutes || 0));
    }, []);

    // Get user role from Firestore
    useEffect(() => {
        if (!user?.uid) return;
        const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                setUserRole(userData.role || 'user');
            }
        });
        return unsub;
    }, [user?.uid]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'users'), snap => {
            const users = snap.docs.map(d => ({
                id: d.id,
                username: d.data().username,
                role: d.data().role || 'user'
            })).filter(u => u.username);
            setAllUsers(users);
        });
        return unsub;
    }, []);

    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, 'notifications'), where('toUserId', '==', user.uid), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setNotifications(snap.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
        return unsub;
    }, [user]);

    useEffect(() => {
        const q = selectedTopic.id === 'general'
            ? query(collection(db, 'posts'), where('topicId', '==', 'general'), orderBy('createdAt', 'desc'))
            : query(collection(db, 'posts'), where('topicId', '==', selectedTopic.id), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snapshot => setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [selectedTopic]);

    const handleNewPostChange = (e) => {
        const value = e.target.value;
        setNewPost(value);
        const cursorPos = e.target.selectionStart;
        const textBefore = value.slice(0, cursorPos);
        const lastAtIndex = textBefore.lastIndexOf('@');
        if (lastAtIndex !== -1) {
            const queryText = textBefore.slice(lastAtIndex + 1);
            if (!/\s/.test(queryText)) {
                setMentionQuery(queryText.toLowerCase());
                setMentionStart(lastAtIndex);
            } else {
                setMentionQuery('');
                setMentionStart(null);
            }
        } else {
            setMentionQuery('');
            setMentionStart(null);
        }
    };

    useEffect(() => {
        const hasSupportKeyword = (text) => {
            const t = (text || '').toLowerCase();
            return t.includes('support') || t.includes('soporte');
        };
        if (mentionQuery) {
            let candidates = allUsers;
            // If not admin, only allow tagging admins and only when message contains support keyword
            if (!isAdmin && userRole !== 'reporter') {
                if (!hasSupportKeyword(newPost)) {
                    setMentionSuggestions([]);
                    return;
                }
                candidates = allUsers.filter(u => u.role === 'admin');
            }
            const suggestions = candidates
                .map(u => u.username)
                .filter(name => name.toLowerCase().startsWith(mentionQuery))
                .slice(0, 5);
            setMentionSuggestions(suggestions);
        } else {
            setMentionSuggestions([]);
        }
    }, [mentionQuery, allUsers, isAdmin, userRole, newPost]);

    const handleSelectMention = (selected) => {
        const textBefore = newPost.slice(0, mentionStart + 1);
        const textAfter = newPost.slice(mentionStart + 1 + mentionQuery.length);
        const newText = textBefore + selected + ' ' + textAfter;
        setNewPost(newText);
        setMentionQuery('');
        setMentionStart(null);
        setMentionSuggestions([]);
        // Set cursor position
        setTimeout(() => {
            const newCursorPos = mentionStart + 1 + selected.length + 1;
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const submitPost = async () => {
        if (!newPost.trim()) return;

        // Check if user can post: admin, reporter role, or topic-specific permissions
        const canPost = isAdmin || userRole === 'reporter' || selectedTopic.canWrite;
        if (!canPost) {
            alert("Solo los administradores o usuarios con rol de reportero pueden publicar en la comunidad.");
            return;
        }

        const currentTopicCanWrite = selectedTopic.id === 'general' ? isAdmin : (selectedTopic.canWrite || isAdmin);
        if (!currentTopicCanWrite) {
            alert("No tiene permiso para publicar en este canal.");
            return;
        }

        setIsLoading(true);

        // --- PUNISHMENT LOGIC ---
        const substitutions = { '1': 'i', '3': 'e', '4': 'a', '5': 's', '0': 'o', '@': 'a', '$': 's' };
        const normalizedText = newPost.toLowerCase().replace(/[\s\-_,.]/g, '').replace(/[13450@$]/g, char => substitutions[char]);
        
        const foundBadWord = censoredWords.some(word => normalizedText.includes(word));

        if (foundBadWord) {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                creditsMinutes: increment(-punishmentMinutes)
            });
            alert(`Su mensaje contiene lenguaje inapropiado. Como sanción, se le han restado ${punishmentMinutes} minutos de su crédito.`);
            setNewPost('');
            setIsLoading(false);
            return; // Stop the function here
        }
        // --- END OF LOGIC ---

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const username = userDoc.data()?.username || 'Usuario Anónimo';

        const postRef = await addDoc(collection(db, 'posts'), {
            text: newPost, // Post the original, uncensored text if it passes
            authorUsername: username,
            authorEmail: user.email,
            authorId: user.uid,
            topicId: selectedTopic.id,
            topicName: selectedTopic.name,
            createdAt: serverTimestamp()
        });
        const postId = postRef.id;

        // --- NOTIFICATION LOGIC FOR TAGS ---
        const tags = newPost.match(/@([a-zA-Z0-9_]+)/g) || [];
        const hasSupportKeyword = (text) => {
            const t = (text || '').toLowerCase();
            return t.includes('support') || t.includes('soporte');
        };
        for (const tag of tags) {
            const taggedUsername = tag.slice(1);
            const usersQueryRef = query(collection(db, 'users'), where('username', '==', taggedUsername));
            const userSnapshot = await getDocs(usersQueryRef);
            if (!userSnapshot.empty) {
                const taggedDoc = userSnapshot.docs[0];
                const taggedUserId = taggedDoc.id;
                const taggedRole = taggedDoc.data()?.role || 'user';
                // Permission: admin can tag anyone; non-admin can only tag admins AND only when message contains 'support'
                if (!isAdmin && userRole !== 'reporter') {
                    if (!(hasSupportKeyword(newPost) && taggedRole === 'admin')) {
                        continue;
                    }
                }
                if (taggedUserId !== user.uid) {
                    await addDoc(collection(db, 'notifications'), {
                        toUserId: taggedUserId,
                        fromUserId: user.uid,
                        fromUsername: username,
                        messageId: postId,
                        topicId: selectedTopic.id,
                        topicName: selectedTopic.name,
                        type: 'mention',
                        textSnippet: newPost.slice(0, 50) + (newPost.length > 50 ? '...' : ''),
                        createdAt: serverTimestamp(),
                        read: false
                    });
                }
            }
        }
        // --- END OF NOTIFICATION LOGIC ---

        setNewPost('');
        setIsLoading(false);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        submitPost();
    };

    const handleTextareaKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitPost();
        }
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm("¿Está seguro de que desea eliminar esta publicación?")) {
            await deleteDoc(doc(db, 'posts', postId));
        }
    };

    // Determine if user can post in current channel
    // Users and admins can post in any channel EXCEPT the general channel
    // General channel is read-only for everyone
    const canPostInCurrentChannel = selectedTopic?.id !== 'general' && (
        isAdmin || 
        userRole === 'reporter' || 
        selectedTopic?.canWrite || 
        selectedTopic?.isOpen === true
    );
    
    // Get permission message
    const getPermissionMessage = () => {
        if (selectedTopic?.id === 'general') {
            return "El canal General es de solo lectura para todos los usuarios.";
        }
        if (isAdmin) return "Escribe un mensaje en la comunidad...";
        if (userRole === 'reporter') return "Escribe un mensaje en la comunidad...";
        if (selectedTopic?.canWrite || selectedTopic?.isOpen === true) {
            return "Escribe un mensaje en la comunidad...";
        }
        return "Solo los administradores o usuarios con rol de reportero pueden publicar. Los usuarios pueden comentar.";
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-8">
            {/* Sidebar and Main Content (UI is unchanged) */}
            <aside className="md:w-64 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl flex-shrink-0">
                <div className="flex items-center justify-between mb-2 px-2">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Canales</h3>
                    <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <input type="checkbox" checked={showOpenOnly} onChange={(e)=>setShowOpenOnly(e.target.checked)} /> Abiertos
                    </label>
                </div>
                <ul className="space-y-1">
                    <li>
                        <button 
                            onClick={() => setSelectedTopic({id: 'notifications', name: 'Notificaciones', logo: '🔔', canWrite: false})} 
                            className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 ${selectedTopic?.id === 'notifications' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            <span>🔔</span>
                            <span>Notificaciones {unreadCount > 0 && <span className="ml-2 px-2 py-1 bg-red-500 text-white rounded-full text-xs">{unreadCount}</span>}</span>
                        </button>
                    </li>
                    <li><button onClick={() => setSelectedTopic({id: 'general', name: 'General', logo: '📢', canWrite: false})} className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 ${selectedTopic?.id === 'general' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}><span>📢</span><span>General</span></button></li>
                    {topics
                        .filter(t => !showOpenOnly || t.isOpen === true)
                        .map(topic => (
                            <li key={topic.id}>
                                <button 
                                    onClick={() => setSelectedTopic(topic)} 
                                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 ${selectedTopic?.id === topic.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    <span>{topic.logo}</span>
                                    <span>{topic.name}</span>
                                    {topic.isOpen === false && (
                                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Cerrado</span>
                                    )}
                                </button>
                            </li>
                    ))}
                </ul>
            </aside>

            <div className="flex-1">
                {selectedTopic.id === 'notifications' ? (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">Notificaciones</h2>
                        {notifications.length === 0 ? (
                            <p className="text-slate-500 dark:text-slate-400">No tienes notificaciones.</p>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map(notif => (
                                    <div key={notif.id} className={`p-4 rounded-xl shadow-lg ${notif.read ? 'bg-white dark:bg-slate-800' : 'bg-blue-50 dark:bg-blue-900/50'}`}>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{notif.fromUsername} te mencionó en #{notif.topicName}</p>
                                        <p className="text-slate-700 dark:text-slate-300">{notif.textSnippet}</p>
                                        <button 
                                            onClick={async () => {
                                                await updateDoc(doc(db, 'notifications', notif.id), { read: true });
                                                const topic = notif.topicId === 'general' 
                                                    ? { id: 'general', name: 'General', logo: '📢', canWrite: false }
                                                    : topics.find(t => t.id === notif.topicId);
                                                if (topic) setSelectedTopic(topic);
                                            }} 
                                            className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Ver publicación
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl mb-8">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">Mural: #{selectedTopic?.name || 'General'}</h2>
                            <form onSubmit={handleFormSubmit}>
                                <textarea 
                                    ref={textareaRef}
                                    value={newPost} 
                                    onChange={handleNewPostChange} 
                                    onKeyDown={handleTextareaKeyPress}
                                    placeholder={getPermissionMessage()}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-700 dark:text-slate-200" 
                                    rows="3"
                                    disabled={!canPostInCurrentChannel}
                                />
                                {!canPostInCurrentChannel && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
                                        💡 Los usuarios pueden comentar en las publicaciones existentes
                                    </p>
                                )}
                                {mentionSuggestions.length > 0 && (
                                    <ul className="absolute z-10 w-full max-w-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                        {mentionSuggestions.map((sugg, idx) => (
                                            <li 
                                                key={idx} 
                                                onClick={() => handleSelectMention(sugg)} 
                                                className="px-4 py-2 text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                                            >
                                                @{sugg}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <button type="submit" disabled={isLoading || !canPostInCurrentChannel} className="w-full mt-2 flex justify-center items-center bg-blue-600 text-white font-bold py-3 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed">
                                    {isLoading ? <Spinner /> : (canPostInCurrentChannel ? 'Publicar' : 'Solo Lectura')}
                                </button>
                                {!canPostInCurrentChannel && (
                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                                            🔒 <strong>Modo Solo Lectura:</strong> Puedes ver y comentar, pero no publicar nuevos mensajes.
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="space-y-4">
                            {posts.map(post => (
                                <div key={post.id} className={`p-4 rounded-xl shadow-lg ${post.authorEmail === 'lejzer36@gmail.com' ? 'bg-blue-50 dark:bg-blue-900/50' : 'bg-white dark:bg-slate-800'}`}>
                                    <PostRenderer text={post.text} topics={topics} onTopicClick={setSelectedTopic} />
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{post.authorUsername}</p>
                                            <RoleBadge postAuthorEmail={post.authorEmail} />
                                        </div>
                                        {isAdmin && (<button onClick={() => handleDeletePost(post.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BulletinBoard;