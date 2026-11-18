import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test Component Crash');
  }
  return <div>Component Rendered Successfully</div>;
};

describe('ErrorBoundary component', () => {
  const originalError = console.error;

  beforeEach(() => {
    // Suppress React's default error log in test output for caught boundary errors
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component Rendered Successfully')).toBeTruthy();
  });

  it('catches thrown error and renders the default accessible fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error View</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error View')).toBeTruthy();
  });

  it('invokes onReset when Try Again is clicked', () => {
    const handleReset = vi.fn();

    render(
      <ErrorBoundary onReset={handleReset}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainBtn);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
