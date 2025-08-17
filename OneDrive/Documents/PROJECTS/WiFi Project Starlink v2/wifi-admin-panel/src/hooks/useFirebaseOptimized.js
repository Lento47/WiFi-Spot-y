import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Assuming db is exported from firebase.js

// Cache for Firebase queries
const queryCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Hook for optimized Firebase queries with caching
export const useFirebaseQuery = (collectionName, constraints = {}, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const cacheKey = useMemo(() => 
    `${collectionName}-${JSON.stringify(constraints)}`, 
    [collectionName, constraints]
  );

  const fetchData = useCallback(async (useCache = true) => {
    try {
      // Check cache first
      if (useCache && queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      // Build query
      let q = collection(collectionName);
      
      if (constraints.where) {
        constraints.where.forEach(([field, operator, value]) => {
          q = query(q, where(field, operator, value));
        });
      }
      
      if (constraints.orderBy) {
        constraints.orderBy.forEach(([field, direction]) => {
          q = query(q, orderBy(field, direction));
        });
      }
      
      if (constraints.limit) {
        q = query(q, limit(constraints.limit));
      }

      // Execute query
      const snapshot = await getDocs(q);
      const result = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cache the result
      queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      setData(result);
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching ${collectionName}:`, err);
      setError(err);
      setLoading(false);
    }
  }, [collectionName, constraints, cacheKey]);

  // Debounced fetch for search operations
  const debouncedFetch = useMemo(() => 
    debounce(fetchData, 300), 
    [fetchData]
  );

  // Real-time listener
  const setupRealtimeListener = useCallback(() => {
    if (!options.realtime) return;

    try {
      let q = collection(collectionName);
      
      if (constraints.where) {
        constraints.where.forEach(([field, operator, value]) => {
          q = query(q, where(field, operator, value));
        });
      }
      
      if (constraints.orderBy) {
        constraints.orderBy.forEach(([field, direction]) => {
          q = query(q, orderBy(field, direction));
        });
      }
      
      if (constraints.limit) {
        q = query(q, limit(constraints.limit));
      }

      unsubscribeRef.current = onSnapshot(q, (snapshot) => {
        const result = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(result);
        
        // Update cache
        queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }, (err) => {
        console.error(`Realtime listener error for ${collectionName}:`, err);
        setError(err);
      });
    } catch (err) {
      console.error(`Error setting up realtime listener for ${collectionName}:`, err);
      setError(err);
    }
  }, [collectionName, constraints, options.realtime, cacheKey]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup realtime listener
  useEffect(() => {
    if (options.realtime) {
      setupRealtimeListener();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [setupRealtimeListener, options.realtime]);

  // Clear cache entry when component unmounts
  useEffect(() => {
    return () => {
      if (queryCache.has(cacheKey)) {
        queryCache.delete(cacheKey);
      }
    };
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(false),
    debouncedRefetch: debouncedFetch,
    clearCache: () => queryCache.delete(cacheKey)
  };
};

// Hook for optimized Firebase document operations
export const useFirebaseDocument = (collectionName, documentId, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const cacheKey = useMemo(() => 
    `${collectionName}-${documentId}`, 
    [collectionName, documentId]
  );

  const fetchDocument = useCallback(async (useCache = true) => {
    try {
      // Check cache first
      if (useCache && queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      // Fetch document
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const result = {
          id: docSnap.id,
          ...docSnap.data()
        };

        // Cache the result
        queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        setData(result);
      } else {
        setData(null);
      }

      setLoading(false);
    } catch (err) {
      console.error(`Error fetching document ${documentId}:`, err);
      setError(err);
      setLoading(false);
    }
  }, [collectionName, documentId, cacheKey]);

  // Setup realtime listener
  useEffect(() => {
    if (options.realtime && documentId) {
      try {
        const docRef = doc(db, collectionName, documentId);
        unsubscribeRef.current = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const result = {
              id: docSnap.id,
              ...docSnap.data()
            };
            setData(result);
            
            // Update cache
            queryCache.set(cacheKey, {
              data: result,
              timestamp: Date.now()
            });
          } else {
            setData(null);
          }
        }, (err) => {
          console.error(`Realtime listener error for document ${documentId}:`, err);
          setError(err);
        });
      } catch (err) {
        console.error(`Error setting up realtime listener for document ${documentId}:`, err);
        setError(err);
      }
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [collectionName, documentId, options.realtime, cacheKey]);

  // Initial fetch
  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [fetchDocument, documentId]);

  // Clear cache entry when component unmounts
  useEffect(() => {
    return () => {
      if (queryCache.has(cacheKey)) {
        queryCache.delete(cacheKey);
      }
    };
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchDocument(false),
    clearCache: () => queryCache.delete(cacheKey)
  };
};

// Utility to clear all cache
export const clearAllCache = () => {
  queryCache.clear();
};

// Utility to get cache statistics
export const getCacheStats = () => {
  const entries = Array.from(queryCache.entries());
  const now = Date.now();
  
  return {
    totalEntries: entries.length,
    activeEntries: entries.filter(([, cached]) => now - cached.timestamp < CACHE_DURATION).length,
    expiredEntries: entries.filter(([, cached]) => now - cached.timestamp >= CACHE_DURATION).length,
    cacheSize: entries.reduce((total, [, cached]) => total + JSON.stringify(cached.data).length, 0)
  };
};
