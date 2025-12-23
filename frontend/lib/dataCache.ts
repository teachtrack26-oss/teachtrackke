/**
 * Simple data cache for API responses to speed up navigation
 * Cache duration: 2 minutes (shorter than auth cache since data changes more often)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Global cache object
const cache: Record<string, CacheEntry<any>> = {};

/**
 * Get data from cache if valid, otherwise return null
 */
export function getCachedData<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    // Cache expired
    delete cache[key];
    return null;
  }
  
  return entry.data;
}

/**
 * Set data in cache
 */
export function setCachedData<T>(key: string, data: T): void {
  cache[key] = {
    data,
    timestamp: Date.now(),
  };
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(key: string): void {
  delete cache[key];
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  Object.keys(cache).forEach(key => delete cache[key]);
}

/**
 * Clear cache entries that match a pattern
 */
export function clearCacheByPattern(pattern: string): void {
  Object.keys(cache).forEach(key => {
    if (key.includes(pattern)) {
      delete cache[key];
    }
  });
}

// Cache keys constants for consistency
export const CACHE_KEYS = {
  SUBJECTS: 'subjects',
  SCHEMES: 'schemes',
  SCHEMES_STATS: 'schemes_stats',
  LESSON_PLANS: 'lesson_plans',
  RECORDS_OF_WORK: 'records_of_work',
  CURRICULUM_PROGRESS: 'curriculum_progress',
  DASHBOARD_INSIGHTS: 'dashboard_insights',
  TIMETABLE_ENTRIES: 'timetable_entries',
  TIMETABLE_SLOTS: 'timetable_slots',
  CURRICULUM_TEMPLATES: 'curriculum_templates',
};
