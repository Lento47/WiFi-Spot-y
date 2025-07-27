import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        getDocs(collection(db, 'censoredWords')).then(s => setCensoredWords(s.docs.map(d => d.data().word)));
        onSnapshot(query(collection(db, 'topics'), orderBy('name')), s => setTopics(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        onSnapshot(doc(db, 'config', 'punishments'), doc => setPunishmentMinutes(doc.data()?.penaltyMinutes || 0));
    }, []);

    useEffect(() => {
        const q = selectedTopic.id === 'general'
            ? query(collection(db, 'posts'), where('topicId', '==', 'general'), orderBy('createdAt', 'desc'))
            : query(collection(db, 'posts'), where('topicId', '==', selectedTopic.id), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snapshot => setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [selectedTopic]);

    const submitPost = async () => {
        if (!newPost.trim()) return;

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

        await addDoc(collection(db, 'posts'), {
            text: newPost, // Post the original, uncensored text if it passes
            authorUsername: username,
            authorEmail: user.email,
            authorId: user.uid,
            topicId: selectedTopic.id,
            topicName: selectedTopic.name,
            createdAt: serverTimestamp()
        });
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

    const canPostInCurrentChannel = isAdmin || selectedTopic?.canWrite;

    return (
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-8">
            {/* Sidebar and Main Content (UI is unchanged) */}
            <aside className="md:w-64 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl flex-shrink-0">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4 px-2">Canales</h3>
                <ul className="space-y-1">
                    <li><button onClick={() => setSelectedTopic({id: 'general', name: 'General', logo: '📢', canWrite: false})} className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 ${selectedTopic?.id === 'general' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}><span>📢</span><span>General</span></button></li>
                    {topics.map(topic => (
                        <li key={topic.id}><button onClick={() => setSelectedTopic(topic)} className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 ${selectedTopic?.id === topic.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}><span>{topic.logo}</span><span>{topic.name}</span></button></li>
                    ))}
                </ul>
            </aside>

            <div className="flex-1">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">Mural: #{selectedTopic?.name || 'General'}</h2>
                    <form onSubmit={handleFormSubmit}>
                        <textarea 
                            value={newPost} 
                            onChange={e => setNewPost(e.target.value)} 
                            onKeyDown={handleTextareaKeyPress}
                            placeholder={canPostInCurrentChannel ? `Escribe un mensaje en #${selectedTopic?.name || 'General'}...` : 'Solo los administradores pueden publicar aquí.'} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-700 border rounded-lg" 
                            rows="3"
                            disabled={!canPostInCurrentChannel}
                        />
                        <button type="submit" disabled={isLoading || !canPostInCurrentChannel} className="w-full mt-2 flex justify-center items-center bg-blue-600 text-white font-bold py-3 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed">
                            {isLoading ? <Spinner /> : 'Publicar'}
                        </button>
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
            </div>
        </div>
    );
};

export default BulletinBoard;