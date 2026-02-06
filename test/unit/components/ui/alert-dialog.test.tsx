/**
 * AlertDialog Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

describe('AlertDialog', () => {
  it('should render trigger', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
      </AlertDialog>
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should open on trigger click', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('should render when defaultOpen', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Alert Title</AlertDialogTitle>
          <AlertDialogDescription>Alert description</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
  });
});

describe('AlertDialogContent', () => {
  it('should render content', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>Content here</AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent className="custom-alert">Content</AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByRole('alertdialog')).toHaveClass('custom-alert');
  });
});

describe('AlertDialogHeader', () => {
  it('should render header', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>Header Content</AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('should have flex layout', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>Header</AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Header')).toHaveClass('flex');
  });
});

describe('AlertDialogFooter', () => {
  it('should render footer', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogFooter>Footer Content</AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('should have flex layout', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogFooter>Footer</AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Footer')).toHaveClass('flex');
  });
});

describe('AlertDialogTitle', () => {
  it('should render title', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Item?</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Delete Item?')).toBeInTheDocument();
  });

  it('should have heading styles', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Title')).toHaveClass('text-lg');
  });
});

describe('AlertDialogDescription', () => {
  it('should render description', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('should have description styles', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogDescription>Description</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Description')).toHaveClass('text-sm');
  });
});

describe('AlertDialogAction', () => {
  it('should render action button', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });
});

describe('AlertDialogCancel', () => {
  it('should render cancel button', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});

describe('AlertDialog composition', () => {
  it('should render complete alert dialog', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('This will permanently delete your account.')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});

describe('AlertDialog accessibility', () => {
  it('should have alertdialog role', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>Content</AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});

describe('AlertDialog displayName', () => {
  it('should have correct displayName', () => {
    expect(AlertDialogHeader.displayName).toBe('AlertDialogHeader');
    expect(AlertDialogFooter.displayName).toBe('AlertDialogFooter');
  });
});
