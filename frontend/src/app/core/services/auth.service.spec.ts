import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const admin = {
    id: 'admin-1',
    email: 'admin@example.com',
    fullName: 'Test Admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  let api: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    api = { get: vi.fn(), post: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: api },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  it('does not trust a profile left in local storage', () => {
    localStorage.setItem('admin_profile', JSON.stringify(admin));
    service = TestBed.inject(AuthService);

    expect(service.currentAdmin()).toBeNull();
  });

  it('restores the session only after the server confirms the HttpOnly-cookie session', async () => {
    service = TestBed.inject(AuthService);
    api.get.mockReturnValue(of({ success: true, data: admin, message: '', meta: null }));

    await new Promise<void>(resolve => {
      service.restoreSession().subscribe(restored => {
        expect(restored).toBe(true);
        resolve();
      });
    });

    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(service.currentAdmin()).toEqual(admin);
  });

  it('clears the session when the server rejects it', async () => {
    service = TestBed.inject(AuthService);
    api.get.mockReturnValue(throwError(() => ({ status: 401 })));

    await new Promise<void>(resolve => {
      service.restoreSession().subscribe(restored => {
        expect(restored).toBe(false);
        resolve();
      });
    });

    expect(service.currentAdmin()).toBeNull();
  });
});
