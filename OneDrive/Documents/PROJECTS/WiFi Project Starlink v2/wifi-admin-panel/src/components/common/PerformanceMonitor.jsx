import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiDatabase, FiClock, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { getCacheStats, clearAllCache } from '../../hooks/useFirebaseOptimized';

const PerformanceMonitor = ({ isVisible = false, onToggle }) => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    memoryUsage: 0,
    cacheStats: null,
    performanceMarks: []
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Performance monitoring
  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      // Memory usage (if available)
      let memoryUsage = 0;
      if (performance.memory) {
        memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      }

      // Cache statistics
      const cacheStats = getCacheStats();

      setMetrics(prev => ({
        ...prev,
        memoryUsage,
        cacheStats,
        renderCount: prev.renderCount + 1
      }));
    };

    const interval = setInterval(updateMetrics, 2000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [isVisible]);

  // Performance marks
  const addPerformanceMark = useMemo(() => (name) => {
    performance.mark(name);
    setMetrics(prev => ({
      ...prev,
      performanceMarks: [...prev.performanceMarks, { name, timestamp: Date.now() }]
    }));
  }, []);

  const measurePerformance = useMemo(() => (startMark, endMark, measureName) => {
    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      return measure.duration;
    } catch (error) {
      console.warn('Performance measurement failed:', error);
      return 0;
    }
  }, []);

  const clearCache = () => {
    clearAllCache();
    setMetrics(prev => ({
      ...prev,
      cacheStats: getCacheStats()
    }));
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed bottom-4 left-4 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <FiActivity className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-800 dark:text-white">Performance</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isExpanded ? '−' : '+'}
            </button>
            <button
              onClick={onToggle}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>

        {/* Basic Metrics */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Renders:</span>
            <span className="font-mono text-gray-800 dark:text-white">{metrics.renderCount}</span>
          </div>
          
          {metrics.memoryUsage > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Memory:</span>
              <span className="font-mono text-gray-800 dark:text-white">{metrics.memoryUsage} MB</span>
            </div>
          )}
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <motion.div
            className="border-t border-gray-200 dark:border-gray-600"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="p-3 space-y-3">
              {/* Cache Statistics */}
              {metrics.cacheStats && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <FiDatabase className="w-3 h-3" />
                    Cache Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-600 dark:text-gray-400">Total:</div>
                    <div className="font-mono text-gray-800 dark:text-white">{metrics.cacheStats.totalEntries}</div>
                    
                    <div className="text-gray-600 dark:text-gray-400">Active:</div>
                    <div className="font-mono text-green-600">{metrics.cacheStats.activeEntries}</div>
                    
                    <div className="text-gray-600 dark:text-gray-400">Expired:</div>
                    <div className="font-mono text-red-600">{metrics.cacheStats.expiredEntries}</div>
                    
                    <div className="text-gray-600 dark:text-gray-400">Size:</div>
                    <div className="font-mono text-gray-800 dark:text-white">
                      {(metrics.cacheStats.cacheSize / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  
                  <button
                    onClick={clearCache}
                    className="w-full px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                  >
                    Clear Cache
                  </button>
                </div>
              )}

              {/* Performance Tools */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  Performance Tools
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => addPerformanceMark('start-operation')}
                    className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                  >
                    Start Mark
                  </button>
                  <button
                    onClick={() => addPerformanceMark('end-operation')}
                    className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                  >
                    End Mark
                  </button>
                </div>
                
                {metrics.performanceMarks.length > 0 && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Marks: {metrics.performanceMarks.map(m => m.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <FiTrendingUp className="w-3 h-3" />
                  Quick Actions
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  >
                    Reload
                  </button>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }}
                    className="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PerformanceMonitor;
