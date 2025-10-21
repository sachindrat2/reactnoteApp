// Performance utilities for debugging
export const perfMonitor = {
  timers: new Map(),
  
  start: (label) => {
    perfMonitor.timers.set(label, performance.now());
  },
  
  end: (label) => {
    const start = perfMonitor.timers.get(label);
    if (start) {
      const duration = performance.now() - start;
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      perfMonitor.timers.delete(label);
      return duration;
    }
  },
  
  measure: (fn, label) => {
    perfMonitor.start(label);
    const result = fn();
    perfMonitor.end(label);
    return result;
  },
  
  measureAsync: async (fn, label) => {
    perfMonitor.start(label);
    const result = await fn();
    perfMonitor.end(label);
    return result;
  }
};

// Quick performance test
export const quickPerfTest = () => {
  console.log('🚀 Quick Performance Test');
  
  // Test localStorage performance
  perfMonitor.start('localStorage-write');
  localStorage.setItem('perf-test', JSON.stringify({ test: 'data', timestamp: Date.now() }));
  perfMonitor.end('localStorage-write');
  
  perfMonitor.start('localStorage-read');
  const data = JSON.parse(localStorage.getItem('perf-test') || '{}');
  perfMonitor.end('localStorage-read');
  
  // Clean up
  localStorage.removeItem('perf-test');
  
  console.log('✅ Performance test completed');
};