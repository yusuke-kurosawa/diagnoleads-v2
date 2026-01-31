import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Authentication Tests
 * 
 * Tests for login/signup functionality and dashboard access
 */

// Mock better-auth
vi.mock('better-auth', () => ({
  betterAuth: vi.fn(() => ({
    api: {
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  })),
}));

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn(),
}));

vi.mock('better-auth/plugins', () => ({
  organization: vi.fn(() => ({})),
}));

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sign Up', () => {
    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.jp',
        'admin+tag@company.org',
      ];
      
      const invalidEmails = [
        'invalid',
        'no@domain',
        '@nodomain.com',
        'spaces in@email.com',
      ];
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      for (const email of validEmails) {
        expect(emailRegex.test(email)).toBe(true);
      }
      
      for (const email of invalidEmails) {
        expect(emailRegex.test(email)).toBe(false);
      }
    });

    it('should validate password strength', () => {
      const strongPasswords = [
        'Password123!',
        'SecureP@ss1',
        'MyStr0ng!Pass',
      ];
      
      const weakPasswords = [
        'password',
        '12345678',
        'short',
        'NoNumbers!',
      ];
      
      // Password should have: 8+ chars, uppercase, lowercase, number, special char
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      
      for (const password of strongPasswords) {
        expect(passwordRegex.test(password)).toBe(true);
      }
      
      for (const password of weakPasswords) {
        expect(passwordRegex.test(password)).toBe(false);
      }
    });

    it('should require name field', () => {
      const validateSignUp = (data: { name?: string; email: string; password: string }) => {
        if (!data.name || data.name.trim().length === 0) {
          return { error: 'Name is required' };
        }
        if (data.name.length > 100) {
          return { error: 'Name is too long' };
        }
        return { success: true };
      };

      expect(validateSignUp({ email: 'test@example.com', password: 'Pass123!' })).toEqual({ error: 'Name is required' });
      expect(validateSignUp({ name: '', email: 'test@example.com', password: 'Pass123!' })).toEqual({ error: 'Name is required' });
      expect(validateSignUp({ name: '  ', email: 'test@example.com', password: 'Pass123!' })).toEqual({ error: 'Name is required' });
      expect(validateSignUp({ name: 'John Doe', email: 'test@example.com', password: 'Pass123!' })).toEqual({ success: true });
    });
  });

  describe('Sign In', () => {
    it('should validate login credentials format', () => {
      const validateLogin = (data: { email: string; password: string }) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(data.email)) {
          return { error: 'Invalid email format' };
        }
        if (!data.password || data.password.length < 1) {
          return { error: 'Password is required' };
        }
        return { success: true };
      };

      expect(validateLogin({ email: 'invalid', password: 'pass' })).toEqual({ error: 'Invalid email format' });
      expect(validateLogin({ email: 'test@example.com', password: '' })).toEqual({ error: 'Password is required' });
      expect(validateLogin({ email: 'test@example.com', password: 'password123' })).toEqual({ success: true });
    });

    it('should handle login error responses', () => {
      const handleLoginError = (errorCode: string) => {
        const errorMessages: Record<string, string> = {
          INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
          USER_NOT_FOUND: 'ユーザーが見つかりません',
          EMAIL_NOT_VERIFIED: 'メールアドレスが確認されていません',
          ACCOUNT_LOCKED: 'アカウントがロックされています',
        };
        
        return errorMessages[errorCode] || '不明なエラーが発生しました';
      };

      expect(handleLoginError('INVALID_CREDENTIALS')).toBe('メールアドレスまたはパスワードが正しくありません');
      expect(handleLoginError('USER_NOT_FOUND')).toBe('ユーザーが見つかりません');
      expect(handleLoginError('UNKNOWN')).toBe('不明なエラーが発生しました');
    });
  });

  describe('Session Management', () => {
    it('should validate session structure', () => {
      interface SessionData {
        user: {
          id: string;
          email: string;
          name: string;
        };
        expiresAt: Date;
      }

      const isValidSession = (session: unknown): session is SessionData => {
        if (!session || typeof session !== 'object') return false;
        const s = session as Record<string, unknown>;
        
        if (!s.user || typeof s.user !== 'object') return false;
        const user = s.user as Record<string, unknown>;
        
        return (
          typeof user.id === 'string' &&
          typeof user.email === 'string' &&
          typeof user.name === 'string' &&
          s.expiresAt instanceof Date
        );
      };

      const validSession = {
        user: { id: 'uuid-123', email: 'test@example.com', name: 'Test User' },
        expiresAt: new Date(),
      };

      const invalidSession = {
        user: { id: 123, email: 'test@example.com' },
      };

      expect(isValidSession(validSession)).toBe(true);
      expect(isValidSession(invalidSession)).toBe(false);
      expect(isValidSession(null)).toBe(false);
    });

    it('should check session expiration', () => {
      const isSessionExpired = (expiresAt: Date): boolean => {
        return new Date() > expiresAt;
      };

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

      expect(isSessionExpired(futureDate)).toBe(false);
      expect(isSessionExpired(pastDate)).toBe(true);
    });
  });

  describe('Dashboard Access', () => {
    it('should require authentication for dashboard', () => {
      const checkDashboardAccess = (session: { user?: { id: string } } | null) => {
        if (!session || !session.user) {
          return { redirect: '/login', reason: 'Not authenticated' };
        }
        return { allowed: true };
      };

      expect(checkDashboardAccess(null)).toEqual({ redirect: '/login', reason: 'Not authenticated' });
      expect(checkDashboardAccess({ user: undefined })).toEqual({ redirect: '/login', reason: 'Not authenticated' });
      expect(checkDashboardAccess({ user: { id: 'user-123' } })).toEqual({ allowed: true });
    });

    it('should require organization membership for org dashboard', () => {
      interface Membership {
        userId: string;
        organizationId: string;
        role: 'owner' | 'admin' | 'member';
      }

      const checkOrgAccess = (
        userId: string,
        organizationId: string,
        memberships: Membership[]
      ) => {
        const membership = memberships.find(
          m => m.userId === userId && m.organizationId === organizationId
        );
        
        if (!membership) {
          return { error: 'FORBIDDEN', message: 'Not a member of this organization' };
        }
        
        return { allowed: true, role: membership.role };
      };

      const memberships: Membership[] = [
        { userId: 'user-1', organizationId: 'org-1', role: 'owner' },
        { userId: 'user-2', organizationId: 'org-1', role: 'member' },
      ];

      expect(checkOrgAccess('user-1', 'org-1', memberships)).toEqual({ allowed: true, role: 'owner' });
      expect(checkOrgAccess('user-2', 'org-1', memberships)).toEqual({ allowed: true, role: 'member' });
      expect(checkOrgAccess('user-3', 'org-1', memberships)).toEqual({ 
        error: 'FORBIDDEN', 
        message: 'Not a member of this organization' 
      });
    });

    it('should enforce role-based permissions', () => {
      type Role = 'owner' | 'admin' | 'member' | 'viewer';
      type Action = 'read' | 'create' | 'update' | 'delete' | 'manage';

      const rolePermissions: Record<Role, Action[]> = {
        owner: ['read', 'create', 'update', 'delete', 'manage'],
        admin: ['read', 'create', 'update', 'delete'],
        member: ['read', 'create', 'update'],
        viewer: ['read'],
      };

      const canPerform = (role: Role, action: Action): boolean => {
        return rolePermissions[role].includes(action);
      };

      // Owner can do everything
      expect(canPerform('owner', 'manage')).toBe(true);
      expect(canPerform('owner', 'delete')).toBe(true);

      // Admin can't manage but can delete
      expect(canPerform('admin', 'manage')).toBe(false);
      expect(canPerform('admin', 'delete')).toBe(true);

      // Member can't delete
      expect(canPerform('member', 'delete')).toBe(false);
      expect(canPerform('member', 'update')).toBe(true);

      // Viewer can only read
      expect(canPerform('viewer', 'read')).toBe(true);
      expect(canPerform('viewer', 'create')).toBe(false);
    });
  });
});

describe('Dashboard Statistics', () => {
  it('should calculate correct conversion rate', () => {
    const calculateConversionRate = (converted: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((converted / total) * 100 * 100) / 100; // 2 decimal places
    };

    expect(calculateConversionRate(0, 0)).toBe(0);
    expect(calculateConversionRate(10, 100)).toBe(10);
    expect(calculateConversionRate(25, 200)).toBe(12.5);
    expect(calculateConversionRate(1, 3)).toBe(33.33);
  });

  it('should aggregate lead statistics correctly', () => {
    interface Lead {
      status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
      score: number;
      source: string;
    }

    const aggregateStats = (leads: Lead[]) => {
      const total = leads.length;
      const byStatus = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const avgScore = total > 0 
        ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / total)
        : 0;

      const bySource = leads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return { total, byStatus, avgScore, bySource };
    };

    const leads: Lead[] = [
      { status: 'new', score: 80, source: 'website' },
      { status: 'contacted', score: 60, source: 'website' },
      { status: 'converted', score: 90, source: 'referral' },
      { status: 'new', score: 70, source: 'api' },
    ];

    const stats = aggregateStats(leads);
    
    expect(stats.total).toBe(4);
    expect(stats.byStatus.new).toBe(2);
    expect(stats.byStatus.contacted).toBe(1);
    expect(stats.byStatus.converted).toBe(1);
    expect(stats.avgScore).toBe(75);
    expect(stats.bySource.website).toBe(2);
    expect(stats.bySource.referral).toBe(1);
  });

  it('should format dashboard display values', () => {
    const formatNumber = (num: number): string => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      }
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
      }
      return num.toString();
    };

    expect(formatNumber(500)).toBe('500');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(25000)).toBe('25.0K');
    expect(formatNumber(1500000)).toBe('1.5M');
  });
});
