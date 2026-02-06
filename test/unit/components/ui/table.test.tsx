/**
 * Table Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

describe('Table', () => {
  it('should render table', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Table className="custom-table">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('table')).toHaveClass('custom-table');
  });

  it('should have base styles', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('table')).toHaveClass('w-full');
    expect(screen.getByRole('table')).toHaveClass('text-sm');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Table ref={ref}>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });
});

describe('TableHeader', () => {
  it('should render table header', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );

    expect(screen.getByRole('rowgroup')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Table>
        <TableHeader className="custom-header">
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );

    const header = screen.getByRole('rowgroup');
    expect(header).toHaveClass('custom-header');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableHeader ref={ref}>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
  });
});

describe('TableBody', () => {
  it('should render table body', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('rowgroup')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Table>
        <TableBody className="custom-body">
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('rowgroup')).toHaveClass('custom-body');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableBody ref={ref}>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
  });
});

describe('TableFooter', () => {
  it('should render table footer', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    const footer = screen.getAllByRole('rowgroup')[1];
    expect(footer).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter className="custom-footer">
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    const footer = screen.getAllByRole('rowgroup')[1];
    expect(footer).toHaveClass('custom-footer');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter ref={ref}>
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
  });
});

describe('TableRow', () => {
  it('should render table row', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('row')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow className="custom-row">
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('row')).toHaveClass('custom-row');
  });

  it('should have hover styles', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('row').className).toContain('hover:');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableBody>
          <TableRow ref={ref}>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableRowElement);
  });
});

describe('TableHead', () => {
  it('should render table head cell', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );

    expect(screen.getByRole('columnheader')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="custom-head">Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );

    expect(screen.getByRole('columnheader')).toHaveClass('custom-head');
  });

  it('should have text styles', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );

    expect(screen.getByRole('columnheader')).toHaveClass('font-medium');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead ref={ref}>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
  });
});

describe('TableCell', () => {
  it('should render table cell', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('cell')).toBeInTheDocument();
    expect(screen.getByText('Cell Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="custom-cell">Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('cell')).toHaveClass('custom-cell');
  });

  it('should have padding styles', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('cell')).toHaveClass('p-4');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell ref={ref}>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
  });
});

describe('TableCaption', () => {
  it('should render table caption', () => {
    render(
      <Table>
        <TableCaption>Table caption</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('Table caption')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Table>
        <TableCaption className="custom-caption">Caption</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('Caption')).toHaveClass('custom-caption');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableCaption ref={ref}>Caption</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(ref.current).toBeInstanceOf(HTMLTableCaptionElement);
  });
});

describe('Table composition', () => {
  it('should render complete table structure', () => {
    render(
      <Table>
        <TableCaption>A list of users</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total: 2 users</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(screen.getByText('A list of users')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Total: 2 users')).toBeInTheDocument();
  });
});

describe('Table displayName', () => {
  it('should have correct displayName', () => {
    expect(Table.displayName).toBe('Table');
    expect(TableHeader.displayName).toBe('TableHeader');
    expect(TableBody.displayName).toBe('TableBody');
    expect(TableFooter.displayName).toBe('TableFooter');
    expect(TableRow.displayName).toBe('TableRow');
    expect(TableHead.displayName).toBe('TableHead');
    expect(TableCell.displayName).toBe('TableCell');
    expect(TableCaption.displayName).toBe('TableCaption');
  });
});
