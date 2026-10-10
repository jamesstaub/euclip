import Service from '@ember/service';

export default class RequestCacheService extends Service {
  cache = new Map<string, any>();
  pendingRequests = new Map<string, Promise<any>>();
  serviceId = Math.random().toString(36).substring(2, 15);

  constructor() {
    super();
    console.log(
      '🔧 RequestCacheService constructor called - Service ID:',
      this.serviceId
    );
  }

  getItem<T>(key: string): T | undefined {
    return this.cache.get(key);
  }

  setItem<T>(key: string, data: T): void {
    this.cache.set(key, data);
    // Clear any pending request for this key since we now have the data
    this.pendingRequests.delete(key);
  }

  hasItem(key: string): boolean {
    return this.cache.has(key);
  }

  // Check if a request is currently in progress for this key
  hasPendingRequest(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  // Get the pending request Promise for this key
  getPendingRequest<T>(key: string): Promise<T> | undefined {
    return this.pendingRequests.get(key);
  }

  // Set a pending request Promise for this key
  setPendingRequest<T>(key: string, promise: Promise<T>): void {
    this.pendingRequests.set(key, promise);
  }

  deleteItem(key: string): boolean {
    return this.cache.delete(key);
  }

  clearCache(): void {
    console.log('Clearing cache, size before:', this.cache.size);
    this.cache.clear();
    console.log('Cache cleared, size after:', this.cache.size);
  }

  get cacheSize(): number {
    return this.cache.size;
  }

  // Helper method to create cache keys for URLs with parameters
  createCacheKey(url: string, params?: { [key: string]: any }): string {
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const paramString = Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    return paramString ? `${url}|${paramString}` : url;
  }
}
