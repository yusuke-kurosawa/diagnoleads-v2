'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type ColumnMapping,
  type ImportSummary,
  detectColumnMappings,
  downloadTemplate,
  parseCSV,
  parseExcel,
  processImport,
} from '@/lib/features/leads/import-service';
import { trpc } from '@/lib/trpc/client';
import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'preview' | 'importing';

export function ImportDialog({ open, onOpenChange, organizationId, onSuccess }: ImportDialogProps) {
  const t = useTranslations('leads.import');
  const tCommon = useTranslations('common');

  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const bulkCreate = trpc.leads.bulkCreate.useMutation({
    onSuccess: (data) => {
      toast.success(t('importSuccess', { count: data.createdCount }));
      onSuccess();
      handleClose();
    },
    onError: () => {
      toast.error(t('importError'));
      setStep('preview');
    },
  });

  const handleClose = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping(null);
    setSummary(null);
    onOpenChange(false);
  };

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name);

      try {
        let parsed: { headers: string[]; rows: Record<string, unknown>[] };

        if (file.name.endsWith('.csv')) {
          const content = await file.text();
          parsed = parseCSV(content);
        } else {
          const buffer = await file.arrayBuffer();
          parsed = parseExcel(buffer);
        }

        if (parsed.rows.length === 0) {
          toast.error(t('noData'));
          return;
        }

        const detectedMapping = detectColumnMappings(parsed.headers);

        if (!detectedMapping.email) {
          toast.error(t('emailRequired'));
          return;
        }

        setHeaders(parsed.headers);
        setRows(parsed.rows);
        setMapping(detectedMapping);

        const importSummary = processImport(parsed.rows, detectedMapping);
        setSummary(importSummary);

        setStep('preview');
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error(t('importError'));
      }
    },
    [t]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        const validExtensions = ['.csv', '.xls', '.xlsx'];
        const hasValidExtension = validExtensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );

        if (hasValidExtension) {
          processFile(file);
        } else {
          toast.error(t('supportedFormats'));
        }
      }
    },
    [processFile, t]
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleImport = () => {
    if (!summary || !mapping) return;

    const validLeads = summary.results.filter((r) => r.success && r.data).map((r) => r.data!);

    if (validLeads.length === 0) {
      toast.error(t('noData'));
      return;
    }

    setStep('importing');
    bulkCreate.mutate({
      organizationId,
      leads: validLeads,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{t('dragDrop')}</p>
                <p className="mt-1 text-xs text-gray-500">{t('supportedFormats')}</p>

                <label className="mt-4 inline-block">
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" className="cursor-pointer" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('selectFile')}
                    </span>
                  </Button>
                </label>
              </div>

              {/* Download Template */}
              <div className="flex justify-center">
                <Button
                  variant="link"
                  onClick={downloadTemplate}
                  className="text-blue-600 dark:text-blue-400"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('downloadTemplate')}
                </Button>
              </div>
            </div>
          )}

          {step === 'preview' && summary && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium">{fileName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge color="emerald">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {summary.successCount} {t('valid')}
                  </Badge>
                  {summary.errorCount > 0 && (
                    <Badge color="amber">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {summary.errorCount} {t('errors')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>{t('validation')}</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.results.slice(0, 10).map((result) => (
                      <TableRow
                        key={result.row}
                        className={!result.success ? 'bg-red-50 dark:bg-red-900/10' : ''}
                      >
                        <TableCell className="font-mono text-xs">{result.row}</TableCell>
                        <TableCell>
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-xs text-red-600">{result.error}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{result.data?.email || '-'}</TableCell>
                        <TableCell>{result.data?.name || '-'}</TableCell>
                        <TableCell>{result.data?.company || '-'}</TableCell>
                        <TableCell>
                          {result.data?.status && <Badge>{result.data.status}</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {summary.totalRows > 10 && (
                  <div className="p-2 text-center text-sm text-gray-500 bg-gray-50 dark:bg-gray-800">
                    ... and {summary.totalRows - 10} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">{t('importing')}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {tCommon('cancel')}
          </Button>
          {step === 'preview' && summary && (
            <Button
              onClick={handleImport}
              disabled={summary.successCount === 0 || bulkCreate.isPending}
            >
              {bulkCreate.isPending
                ? t('importing')
                : t('importButton', { count: summary.successCount })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
