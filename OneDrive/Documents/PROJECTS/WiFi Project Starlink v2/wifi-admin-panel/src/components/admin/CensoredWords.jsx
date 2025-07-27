import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

const CensoredWords = () => {
    const [words, setWords] = useState([]);
    const [newWord, setNewWord] = useState('');

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'censoredWords'), snapshot => {
            setWords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const handleAddWord = async (e) => {
        e.preventDefault();
        if (!newWord.trim()) return;
        await addDoc(collection(db, 'censoredWords'), {
            word: newWord.toLowerCase().trim()
        });
        setNewWord('');
    };

    const handleDeleteWord = async (id) => {
        await deleteDoc(doc(db, 'censoredWords', id));
    };

    return (
        <div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">Moderar Palabras del Mural</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h4 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-4">Añadir Palabra Prohibida</h4>
                    <form onSubmit={handleAddWord} className="flex items-center space-x-2">
                        <input 
                            type="text" 
                            value={newWord} 
                            onChange={e => setNewWord(e.target.value)} 
                            placeholder="Escriba una palabra..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                        />
                        <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Añadir</button>
                    </form>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h4 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-4">Lista de Palabras Prohibidas</h4>
                    <div className="max-h-60 overflow-y-auto">
                        <ul className="space-y-2">
                            {words.map(item => (
                                <li key={item.id} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center">
                                    <span className="text-slate-700 dark:text-slate-300">{item.word}</span>
                                    <button onClick={() => handleDeleteWord(item.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Eliminar</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CensoredWords;