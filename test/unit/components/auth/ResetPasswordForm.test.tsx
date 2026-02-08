/**
 * ResetPasswordForm Component Tests
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock auth client
const mockRequestPasswordReset = vi.fn();
vi.mock('@/lib/auth/client', () => ({
  authClient: {
    requestPasswordReset: (data: any) => mockRequestPasswordReset(data),
  },
}));

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { toast } from 'sonner';

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render reset password form', () => {
    render(<ResetPasswordForm />);

    expect(screen.getByLabelText(/emailLabel/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submitButton/i })).toBeInTheDocument();
    expect(screen.getByText(/description/i)).toBeInTheDocument();
  });

  it('should not call requestPasswordReset with invalid email', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    const emailInput = screen.getByLabelText(/emailLabel/i);
    const submitButton = screen.getByRole('button', { name: /submitButton/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    // Wait a bit then verify API was NOT called due to validation
    await new Promise((r) => setTimeout(r, 100));
    expect(mockRequestPasswordReset).not.toHaveBeenCalled();
  });

  it('should call requestPasswordReset with correct data', async () => {
    mockRequestPasswordReset.mockResolvedValueOnce({ data: { status: true } });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/emailLabel/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submitButton/i }));

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({
        email: 'test@example.com',
        redirectTo: '/reset-password/confirm',
      });
    });
  });

  it('should show success message after submission', async () => {
    mockRequestPasswordReset.mockResolvedValueOnce({ data: { status: true } });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/emailLabel/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submitButton/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
      expect(screen.getByText(/successTitle/i)).toBeInTheDocument();
      expect(screen.getByText(/successMessage/i)).toBeInTheDocument();
      expect(screen.getByText(/successNote/i)).toBeInTheDocument();
    });
  });

  it('should show success even when email not found (security)', async () => {
    mockRequestPasswordReset.mockResolvedValueOnce({
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/emailLabel/i), 'nonexistent@example.com');
    await user.click(screen.getByRole('button', { name: /submitButton/i }));

    await waitFor(() => {
      // Should still show success to prevent email enumeration
      expect(toast.success).toHaveBeenCalled();
      expect(screen.getByText(/successTitle/i)).toBeInTheDocument();
    });
  });

  it('should show success even on network error (security)', async () => {
    mockRequestPasswordReset.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/emailLabel/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submitButton/i }));

    await waitFor(() => {
      // Should still show success to prevent timing attacks
      expect(toast.success).toHaveBeenCalled();
      expect(screen.getByText(/successTitle/i)).toBeInTheDocument();
    });
  });

  it('should disable form while loading', async () => {
    let resolveReset: (value: any) => void;
    mockRequestPasswordReset.mockImplementationOnce(
      () => new Promise((resolve) => { resolveReset = resolve; })
    );

    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/emailLabel/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submitButton/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/emailLabel/i)).toBeDisabled();
    });

    resolveReset!({ data: { status: true } });
  });

  it('should show submitting button text while loading', async () => {
    let resolveReset: (value: any) => void;
    mockRequestPasswordReset.mockImplementationOnce(
      () => new Promise((resolve) => { resolveReset = resolve; })
    );

    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/emailLabel/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submitButton/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submittingButton/i })).toBeInTheDocument();
    });

    resolveReset!({ data: { status: true } });
  });

  it('should not show form after success', async () => {
    mockRequestPasswordReset.mockResolvedValueOnce({ data: { status: true } });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/emailLabel/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submitButton/i }));

    await waitFor(() => {
      expect(screen.queryByLabelText(/emailLabel/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /submitButton/i })).not.toBeInTheDocument();
    });
  });
});
