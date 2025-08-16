import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import Icon from '../common/Icon.jsx';

const EnhancedBulletinBoard = ({ user, isAdmin = false }) => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        category: 'news',
        priority: 'normal',
        imageUrl: '',
        isPinned: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showNewPostForm, setShowNewPostForm] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const categories = [
        { id: 'news', label: 'Noticias Locales', icon: '📰', color: 'bg-blue-100 text-blue-800' },
        { id: 'events', label: 'Eventos', icon: '🎉', color: 'bg-green-100 text-green-800' },
        { id: 'promotions', label: 'Promociones', icon: '🎁', color: 'bg-purple-100 text-purple-800' },
        { id: 'community', label: 'Comunidad', icon: '🤝', color: 'bg-orange-100 text-orange-800' },
        { id: 'updates', label: 'Actualizaciones', icon: '📢', color: 'bg-red-100 text-red-800' }
    ];

    const priorities = [
        { id: 'low', label: 'Baja', color: 'bg-gray-100 text-gray-600' },
        { id: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-600' },
        { id: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-600' },
        { id: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-600' }
    ];

    useEffect(() => {
        const postsQuery = query(
            collection(db, 'bulletinPosts'),
            orderBy('isPinned', 'desc'),
            orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPosts(postsData);
        });

        return unsubscribe;
    }, []);

    const handleImageUpload = async (file) => {
        if (!file) return;
        
        setUploadingImage(true);
        try {
            const storageRef = ref(storage, `bulletin-images/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            setNewPost(prev => ({ ...prev, imageUrl: downloadURL }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen. Por favor intente nuevamente.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.title.trim() || !newPost.content.trim()) {
            alert('Por favor complete el título y contenido del post.');
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'bulletinPosts'), {
                ...newPost,
                authorId: user.uid,
                authorName: user.username || user.email,
                authorEmail: user.email,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                likes: [],
                comments: [],
                views: 0
            });

            setNewPost({
                title: '',
                content: '',
                category: 'news',
                priority: 'normal',
                imageUrl: '',
                isPinned: false
            });
            setShowNewPostForm(false);
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error al crear el post. Por favor intente nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTogglePin = async (postId, currentPinStatus) => {
        if (!isAdmin) return;
        
        try {
            await updateDoc(doc(db, 'bulletinPosts', postId), {
                isPinned: !currentPinStatus,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!isAdmin) return;
        
        if (confirm('¿Está seguro de que desea eliminar este post?')) {
            try {
                await deleteDoc(doc(db, 'bulletinPosts', postId));
            } catch (error) {
                console.error('Error deleting post:', error);
            }
        }
    };

    const filteredPosts = posts.filter(post => 
        selectedCategory === 'all' || post.category === selectedCategory
    );

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-CR');
    };

    const getCategoryInfo = (categoryId) => {
        return categories.find(cat => cat.id === categoryId) || categories[0];
    };

    const getPriorityInfo = (priorityId) => {
        return priorities.find(pri => pri.id === priorityId) || priorities[1];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                            Tablero Comunitario
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Noticias, eventos y anuncios de la comunidad local
                        </p>
                    </div>
                    {user && (
                        <button
                            onClick={() => setShowNewPostForm(!showNewPostForm)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                        >
                            <Icon path="M12 4.5v15m7.5-7.5h-15" className="w-5 h-5 inline mr-2" />
                            Nuevo Post
                        </button>
                    )}
                </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedCategory === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                    >
                        Todas las Categorías
                    </button>
                    {categories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                selectedCategory === category.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            <span>{category.icon}</span>
                            {category.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* New Post Form */}
            {showNewPostForm && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                        Crear Nuevo Post
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    value={newPost.title}
                                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Título del post..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Categoría
                                </label>
                                <select
                                    value={newPost.category}
                                    onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.icon} {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Prioridad
                                </label>
                                <select
                                    value={newPost.priority}
                                    onChange={(e) => setNewPost(prev => ({ ...prev, priority: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {priorities.map(priority => (
                                        <option key={priority.id} value={priority.id}>
                                            {priority.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Imagen (Opcional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0])}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {uploadingImage && (
                                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                        Subiendo imagen...
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Contenido *
                            </label>
                            <textarea
                                value={newPost.content}
                                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                                rows={6}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Escriba el contenido del post..."
                                required
                            />
                        </div>

                        {isAdmin && (
                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newPost.isPinned}
                                        onChange={(e) => setNewPost(prev => ({ ...prev, isPinned: e.target.checked }))}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Fijar en la parte superior
                                    </span>
                                </label>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                            >
                                {isSubmitting ? 'Publicando...' : 'Publicar Post'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowNewPostForm(false)}
                                className="bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Posts Display */}
            <div className="space-y-4">
                {filteredPosts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg text-center">
                        <p className="text-slate-500 dark:text-slate-400">
                            No hay posts en esta categoría.
                        </p>
                    </div>
                ) : (
                    filteredPosts.map(post => (
                        <div
                            key={post.id}
                            className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border-l-4 ${
                                post.isPinned ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-l-transparent'
                            }`}
                        >
                            {/* Post Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryInfo(post.category).color}`}>
                                        {getCategoryInfo(post.category).icon} {getCategoryInfo(post.category).label}
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityInfo(post.priority).color}`}>
                                        {getPriorityInfo(post.priority).label}
                                    </div>
                                    {post.isPinned && (
                                        <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                            📌 Fijado
                                        </div>
                                    )}
                                </div>
                                {isAdmin && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleTogglePin(post.id, post.isPinned)}
                                            className="p-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                                            title={post.isPinned ? 'Desfijar' : 'Fijar'}
                                        >
                                            <Icon path="M5 15l7-7 7 7" className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePost(post.id)}
                                            className="p-2 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                                            title="Eliminar"
                                        >
                                            <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Post Content */}
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                                {post.title}
                            </h3>
                            
                            {post.imageUrl && (
                                <div className="mb-4">
                                    <img
                                        src={post.imageUrl}
                                        alt={post.title}
                                        className="w-full max-w-md rounded-lg shadow-md"
                                    />
                                </div>
                            )}
                            
                            <p className="text-slate-700 dark:text-slate-300 mb-4 whitespace-pre-wrap">
                                {post.content}
                            </p>

                            {/* Post Footer */}
                            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-4">
                                    <span>Por: {post.authorName}</span>
                                    <span>{formatDate(post.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span>👁️ {post.views || 0} vistas</span>
                                    <span>❤️ {post.likes?.length || 0} me gusta</span>
                                    <span>💬 {post.comments?.length || 0} comentarios</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EnhancedBulletinBoard;
