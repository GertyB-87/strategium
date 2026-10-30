import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly storageError = signal<string | null>(null);
  readonly error = this.storageError.asReadonly();

  getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const value = window.localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      this.storageError.set('Saved data could not be read. Browser storage may be unavailable or damaged.');
      return null;
    }
  }

  setItem<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      this.storageError.set(null);
      return true;
    } catch {
      this.storageError.set('Changes are not being saved. Check browser storage before leaving this page.');
      return false;
    }
  }
}