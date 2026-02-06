/**
 * Dialog Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

describe('Dialog', () => {
  it('should render dialog trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('should open dialog on trigger click', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should render dialog content when open', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog description')).toBeInTheDocument();
  });
});

describe('DialogContent', () => {
  it('should render content', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>Content here</DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('should have close button', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent className="custom-dialog">Content</DialogContent>
      </Dialog>
    );

    expect(screen.getByRole('dialog')).toHaveClass('custom-dialog');
  });
});

describe('DialogHeader', () => {
  it('should render header', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>Header Content</DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader className="custom-header">Header</DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Header')).toHaveClass('custom-header');
  });

  it('should have flex layout', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>Header</DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Header')).toHaveClass('flex');
    expect(screen.getByText('Header')).toHaveClass('flex-col');
  });
});

describe('DialogFooter', () => {
  it('should render footer', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogFooter>Footer Content</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogFooter className="custom-footer">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Footer')).toHaveClass('custom-footer');
  });

  it('should have flex layout', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogFooter>Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Footer')).toHaveClass('flex');
  });
});

describe('DialogTitle', () => {
  it('should render title', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>My Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle className="custom-title">Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Title')).toHaveClass('custom-title');
  });

  it('should have title styles', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Title')).toHaveClass('text-lg');
    expect(screen.getByText('Title')).toHaveClass('font-semibold');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle ref={ref}>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe('DialogDescription', () => {
  it('should render description', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogDescription>Description text</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogDescription className="custom-desc">Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Description')).toHaveClass('custom-desc');
  });

  it('should have description styles', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Description')).toHaveClass('text-sm');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogDescription ref={ref}>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});

describe('Dialog composition', () => {
  it('should render complete dialog structure', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here.
            </DialogDescription>
          </DialogHeader>
          <div>Form content</div>
          <DialogFooter>
            <button>Cancel</button>
            <button>Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByText('Make changes to your profile here.')).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});

describe('Dialog accessibility', () => {
  it('should have dialog role', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should have accessible close button', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    // sr-only text for screen readers
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});

describe('Dialog displayName', () => {
  it('should have correct displayName', () => {
    expect(DialogHeader.displayName).toBe('DialogHeader');
    expect(DialogFooter.displayName).toBe('DialogFooter');
  });
});
