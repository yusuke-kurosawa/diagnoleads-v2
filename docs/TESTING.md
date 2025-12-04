# Testing Guide

## Overview

DiagnoLeads v2 uses the following testing tools:

- **Vitest** - Unit and integration testing
- **React Testing Library** - Component testing
- **Playwright** - End-to-end testing

## Test Structure

```
test/
├── unit/              # Unit tests
│   ├── components/    # UI component tests
│   ├── features/      # Feature/service tests
│   └── trpc/          # tRPC router tests
└── e2e/               # End-to-end tests
```

## Running Tests

```bash
# Run all unit tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run specific test file
bun run test test/unit/features/export-service.test.ts

# Run E2E tests
bun run test:e2e
```

## Writing Tests

### Unit Tests

Unit tests are located in `test/unit/` and should test individual functions or modules in isolation.

```typescript
// test/unit/features/my-service.test.ts
import { myFunction } from '@/lib/features/my-service';
import { describe, expect, it } from 'vitest';

describe('My Service', () => {
  describe('myFunction', () => {
    it('should return expected result', () => {
      const result = myFunction('input');
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

### Component Tests

Component tests use React Testing Library to test UI components.

```typescript
// test/unit/components/my-component.test.tsx
import { MyComponent } from '@/components/my-component';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### tRPC Router Tests

Test tRPC procedures by calling them directly.

```typescript
// test/unit/trpc/my-router.test.ts
import { appRouter } from '@/server/routers/_app';
import { createCallerFactory } from '@/server/trpc';
import { describe, expect, it, vi } from 'vitest';

describe('My Router', () => {
  const createCaller = createCallerFactory(appRouter);

  it('should return data', async () => {
    const caller = createCaller({
      session: { user: { id: 'user-1' } },
      organizationId: 'org-1',
    });

    const result = await caller.myRouter.getData();
    expect(result).toBeDefined();
  });
});
```

### E2E Tests

End-to-end tests use Playwright to test full user flows.

```typescript
// test/e2e/my-flow.spec.ts
import { expect, test } from '@playwright/test';

test.describe('My Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Login steps...
  });

  test('should complete flow successfully', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading')).toHaveText('Dashboard');

    await page.click('button[data-testid="action-btn"]');
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## Mocking

### Mock Environment Variables

Environment variables are set in `test/setup.ts`:

```typescript
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
```

### Mock Next.js Router

The Next.js router is mocked in `test/setup.ts`:

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
```

### Mock Database

For database tests, use a mock or test database:

```typescript
import { vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockResolvedValue([{ id: '1' }]),
  },
}));
```

### Mock External APIs

```typescript
import { vi } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ text: 'Mocked response' }],
      }),
    };
  },
}));
```

## Coverage

Coverage thresholds are set in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
}
```

View coverage report:

```bash
bun run test:coverage
# HTML report: coverage/index.html
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// Good - tests behavior
it('should display error message on invalid input', async () => {
  render(<Form />);
  await userEvent.type(screen.getByRole('textbox'), 'invalid');
  await userEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('alert')).toHaveTextContent('Invalid input');
});

// Bad - tests implementation details
it('should set error state to true', () => {
  const { result } = renderHook(() => useForm());
  act(() => result.current.setError(true));
  expect(result.current.error).toBe(true);
});
```

### 2. Use Descriptive Test Names

```typescript
// Good
describe('LeadTable', () => {
  it('should filter leads by status when status filter is changed', () => {});
  it('should export filtered leads to CSV when export button is clicked', () => {});
});

// Bad
describe('LeadTable', () => {
  it('works', () => {});
  it('filters', () => {});
});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should update lead status', async () => {
  // Arrange
  const lead = { id: '1', status: 'new' };
  render(<LeadCard lead={lead} onUpdate={mockUpdate} />);

  // Act
  await userEvent.click(screen.getByText('Mark as Contacted'));

  // Assert
  expect(mockUpdate).toHaveBeenCalledWith({ id: '1', status: 'contacted' });
});
```

### 4. Test Edge Cases

```typescript
describe('formatDate', () => {
  it('should format valid date', () => {
    expect(formatDate(new Date('2024-01-15'))).toBe('Jan 15, 2024');
  });

  it('should handle null date', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('should handle invalid date', () => {
    expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
  });
});
```

### 5. Keep Tests Independent

Each test should be able to run in isolation:

```typescript
// Good - each test sets up its own data
describe('Leads', () => {
  it('should create lead', async () => {
    const lead = await createLead({ email: 'test@example.com' });
    expect(lead.id).toBeDefined();
  });

  it('should update lead', async () => {
    const lead = await createLead({ email: 'test2@example.com' });
    const updated = await updateLead(lead.id, { status: 'contacted' });
    expect(updated.status).toBe('contacted');
  });
});
```

## Debugging Tests

### Run Single Test

```bash
bun run test -t "should render correctly"
```

### Verbose Output

```bash
bun run test --reporter=verbose
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["--run", "${file}"],
  "console": "integratedTerminal"
}
```

## CI/CD Integration

Tests run automatically in CI:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: bun run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```
