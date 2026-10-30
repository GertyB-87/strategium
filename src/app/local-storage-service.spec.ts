import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage-service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    service = TestBed.inject(LocalStorageService);
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('round-trips saved data', () => {
    expect(service.setItem('test', { round: 2 })).toBe(true);
    expect(service.getItem('test')).toEqual({ round: 2 });
    expect(service.error()).toBeNull();
  });

  it('returns null for missing or malformed data', () => {
    expect(service.getItem('missing')).toBeNull();
    localStorage.setItem('broken', '{');
    expect(service.getItem('broken')).toBeNull();
    expect(service.error()).toBeTruthy();
  });

  it('handles unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    expect(service.getItem('test')).toBeNull();
    expect(service.error()).toBeTruthy();
  });

  it('reports failed writes and clears the error after a successful save', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    expect(service.setItem('test', {})).toBe(false);
    expect(service.error()).toBeTruthy();
    write.mockRestore();
    expect(service.setItem('test', {})).toBe(true);
    expect(service.error()).toBeNull();
  });
});