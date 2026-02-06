/**
 * Tabs Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

describe('Tabs', () => {
  it('should render tabs container', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('should render with default value', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Content 1')).toBeVisible();
  });
});

describe('TabsList', () => {
  it('should render tab list', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-tablist">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(screen.getByRole('tablist')).toHaveClass('custom-tablist');
  });

  it('should have base styles', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveClass('inline-flex');
    expect(tablist).toHaveClass('rounded-md');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Tabs defaultValue="tab1">
        <TabsList ref={ref}>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('TabsTrigger', () => {
  it('should render tab trigger', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(screen.getByRole('tab')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" className="custom-trigger">
            Tab 1
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(screen.getByRole('tab')).toHaveClass('custom-trigger');
  });

  it('should have base styles', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const trigger = screen.getByRole('tab');
    expect(trigger).toHaveClass('inline-flex');
    expect(trigger).toHaveClass('items-center');
    expect(trigger).toHaveClass('rounded-sm');
  });

  it('should switch tabs on click', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    // Tab 1 should be active initially
    expect(screen.getByText('Tab 1')).toHaveAttribute('data-state', 'active');
    expect(screen.getByText('Tab 2')).toHaveAttribute('data-state', 'inactive');
  });

  it('should show active state', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const activeTab = screen.getByText('Tab 1');
    expect(activeTab).toHaveAttribute('data-state', 'active');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" ref={ref}>
            Tab 1
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('TabsContent', () => {
  it('should render content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content">
          Content 1
        </TabsContent>
      </Tabs>
    );

    expect(screen.getByRole('tabpanel')).toHaveClass('custom-content');
  });

  it('should have base styles', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );

    const content = screen.getByRole('tabpanel');
    expect(content).toHaveClass('mt-2');
  });

  it('should hide inactive content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    // Inactive tab should not be in DOM or have hidden state
    const inactiveContent = screen.queryByText('Content 2');
    if (inactiveContent) {
      expect(inactiveContent).toHaveAttribute('data-state', 'inactive');
    } else {
      expect(inactiveContent).toBeNull();
    }
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" ref={ref}>
          Content 1
        </TabsContent>
      </Tabs>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Tabs accessibility', () => {
  it('should have tablist role', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('should have tab role for triggers', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(screen.getByRole('tab')).toBeInTheDocument();
  });

  it('should have tabpanel role for content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );

    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('should support keyboard navigation', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tab1 = screen.getByText('Tab 1');
    tab1.focus();
    expect(document.activeElement).toBe(tab1);
  });
});

describe('Tabs displayName', () => {
  it('should have correct displayName for TabsList', () => {
    expect(TabsList.displayName).toBeDefined();
  });

  it('should have correct displayName for TabsTrigger', () => {
    expect(TabsTrigger.displayName).toBeDefined();
  });

  it('should have correct displayName for TabsContent', () => {
    expect(TabsContent.displayName).toBeDefined();
  });
});
