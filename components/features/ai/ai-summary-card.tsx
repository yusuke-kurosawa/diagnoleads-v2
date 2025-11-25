'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw, Loader2 } from 'lucide-react';

interface AISummaryCardProps {
  summary?: string;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

/**
 * AI Summary Card Component
 * Displays AI-generated summary of a lead
 */
export function AISummaryCard({
  summary,
  onGenerate,
  isGenerating,
}: AISummaryCardProps) {
  const t = useTranslations('ai');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          {t('aiSummary')}
        </h3>
        {onGenerate && (
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            size="sm"
            variant="outline"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {summary ? t('regenerate') : t('generate')}
              </>
            )}
          </Button>
        )}
      </div>

      {isGenerating ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : summary ? (
        <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
      ) : (
        <p className="text-sm text-gray-500">{t('noSummaryAvailable')}</p>
      )}
    </Card>
  );
}
