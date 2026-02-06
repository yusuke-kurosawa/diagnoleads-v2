/**
 * Form Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Test wrapper component
function TestForm({
  defaultValues = { name: '' },
  onSubmit = () => {},
  schema = z.object({ name: z.string().min(1, 'Name is required') }),
  children,
}: {
  defaultValues?: Record<string, string>;
  onSubmit?: (data: Record<string, string>) => void;
  schema?: z.ZodSchema;
  children?: React.ReactNode;
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Enter your name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {children}
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}

describe('Form', () => {
  it('should render form', () => {
    render(<TestForm />);
    expect(document.querySelector('form')).toBeInTheDocument();
  });

  it('should render form field', () => {
    render(<TestForm />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<TestForm />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });
});

describe('FormItem', () => {
  it('should render form item', () => {
    render(<TestForm />);
    expect(document.querySelector('.space-y-2')).toBeInTheDocument();
  });
});

describe('FormLabel', () => {
  it('should render label', () => {
    render(<TestForm />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should be associated with input', () => {
    render(<TestForm />);
    const input = screen.getByLabelText('Name');
    expect(input).toBeInTheDocument();
  });
});

describe('FormControl', () => {
  it('should render input', () => {
    render(<TestForm />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should handle input change', () => {
    render(<TestForm />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'John' } });
    expect(input).toHaveValue('John');
  });
});

describe('FormDescription', () => {
  it('should render description', () => {
    render(<TestForm />);
    expect(screen.getByText('Enter your name')).toBeInTheDocument();
  });

  it('should have description styles', () => {
    render(<TestForm />);
    const description = screen.getByText('Enter your name');
    expect(description).toHaveClass('text-sm');
  });
});

describe('FormMessage', () => {
  it('should not render when no error', () => {
    render(<TestForm defaultValues={{ name: 'Valid' }} />);
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
  });

  it('should show error message on validation failure', async () => {
    render(<TestForm />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('should have error styles', async () => {
    render(<TestForm />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      const errorMessage = screen.getByText('Name is required');
      expect(errorMessage).toHaveClass('text-red-500');
    });
  });
});

describe('Form submission', () => {
  it('should submit form with valid data', async () => {
    const handleSubmit = vi.fn();
    render(<TestForm onSubmit={handleSubmit} />);
    
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'John Doe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ name: 'John Doe' }, expect.anything());
    });
  });

  it('should not submit form with invalid data', async () => {
    const handleSubmit = vi.fn();
    render(<TestForm onSubmit={handleSubmit} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });
});

describe('Form validation', () => {
  it('should validate min length', async () => {
    const schema = z.object({
      name: z.string().min(3, 'Name must be at least 3 characters'),
    });
    
    render(<TestForm schema={schema} />);
    
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Jo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('should clear error when input becomes valid', async () => {
    render(<TestForm />);
    
    // Submit empty to trigger error
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    
    // Enter valid value
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'John' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });
});

describe('FormField displayName', () => {
  it('should have correct displayName', () => {
    expect(FormItem.displayName).toBe('FormItem');
    expect(FormLabel.displayName).toBe('FormLabel');
    expect(FormControl.displayName).toBe('FormControl');
    expect(FormDescription.displayName).toBe('FormDescription');
    expect(FormMessage.displayName).toBe('FormMessage');
  });
});

// Import vi for mocking
import { vi } from 'vitest';
