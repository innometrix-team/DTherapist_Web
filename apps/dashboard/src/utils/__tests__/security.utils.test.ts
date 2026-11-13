import { describe, it, expect, vi } from 'vitest';
import { isValidRedirectUrl, safeRedirect } from '../security.utils';

describe('security.utils - isValidRedirectUrl', () => {
  it('allows secure https URLs', () => {
    expect(isValidRedirectUrl('https://checkout.paystack.com/pay/abc123')).toBe(true);
    expect(isValidRedirectUrl('https://api.dtherapist.com/callback')).toBe(true);
  });

  it('allows http URLs for local development', () => {
    expect(isValidRedirectUrl('http://localhost:3000')).toBe(true);
    expect(isValidRedirectUrl('http://127.0.0.1:5173/dashboard')).toBe(true);
  });

  it('allows relative paths', () => {
    expect(isValidRedirectUrl('/dashboard')).toBe(true);
    expect(isValidRedirectUrl('/appointments?id=123')).toBe(true);
  });

  it('blocks dangerous javascript: pseudo-protocol URIs', () => {
    expect(isValidRedirectUrl('javascript:alert(document.cookie)')).toBe(false);
    expect(isValidRedirectUrl('JAVASCRIPT:void(0)')).toBe(false);
    expect(isValidRedirectUrl('  javascript:alert(1)')).toBe(false);
  });

  it('blocks data: URIs and vbscript: URIs', () => {
    expect(isValidRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidRedirectUrl('vbscript:msgbox("XSS")')).toBe(false);
  });

  it('handles empty or non-string inputs safely', () => {
    expect(isValidRedirectUrl('')).toBe(false);
    expect(isValidRedirectUrl('   ')).toBe(false);
    expect(isValidRedirectUrl(null)).toBe(false);
    expect(isValidRedirectUrl(undefined)).toBe(false);
  });
});

describe('security.utils - safeRedirect', () => {
  it('does not assign dangerous javascript: URIs to window.location', () => {
    const assignMock = vi.fn();
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        assign: assignMock,
        href: 'http://localhost:5173/',
      },
    });

    try {
      const redirected = safeRedirect('javascript:alert(1)');
      expect(redirected).toBe(false);
      expect(assignMock).not.toHaveBeenCalled();
    } finally {
      if (originalLocationDescriptor) {
        Object.defineProperty(window, 'location', originalLocationDescriptor);
      }
    }
  });
});
