'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { LeadScore } from '@/lib/features/ai';
import { AlertCircle, Brain, Loader2, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface AIScoreCardProps {
  score?: number | null;
  aiScore?: LeadScore | null;
  onGenerateScore?: () => void;
  isGenerating?: boolean;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const confidenceColors = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-green-600',
};

/**
 * AI Score Card Component
 * Displays AI-generated lead score with confidence, reasoning, and recommendations
 */
export function AIScoreCard({ score, aiScore, onGenerateScore, isGenerating }: AIScoreCardProps) {
  const t = useTranslations('ai');
  const [showDetails, setShowDetails] = useState(false);

  // Show simple score if AI score is not available
  if (!aiScore && score !== null && score !== undefined) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            {t('leadScore')}
          </h3>
          {onGenerateScore && (
            <Button onClick={onGenerateScore} disabled={isGenerating} size="sm" variant="outline">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('generating')}
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  {t('generateAIScore')}
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-blue-600">{score}</span>
          <span className="text-xl text-gray-500">/ 100</span>
        </div>

        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </Card>
    );
  }

  // Show AI-powered score with full details
  if (aiScore) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            {t('aiLeadScore')}
          </h3>
          <div className="flex items-center gap-2">
            <Badge className={priorityColors[aiScore.priority]}>
              {t(`priority.${aiScore.priority}`)}
            </Badge>
            {onGenerateScore && (
              <Button onClick={onGenerateScore} disabled={isGenerating} size="sm" variant="ghost">
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Score display */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold text-blue-600">{aiScore.score}</span>
          <span className="text-xl text-gray-500">/ 100</span>
          <span className={`text-sm font-medium ml-2 ${confidenceColors[aiScore.confidence]}`}>
            {t(`confidence.${aiScore.confidence}`)}
          </span>
        </div>

        {/* Score bar */}
        <div className="mb-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${aiScore.score}%` }}
            />
          </div>
        </div>

        {/* Reasoning */}
        {showDetails && (
          <div className="space-y-4 mt-4 pt-4 border-t">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                {t('reasoning')}
              </h4>
              <p className="text-sm text-gray-700">{aiScore.reasoning}</p>
            </div>

            {/* Recommended actions */}
            {aiScore.recommendedActions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">{t('recommendedActions')}</h4>
                <ul className="space-y-2">
                  {aiScore.recommendedActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Toggle details button */}
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="ghost"
          size="sm"
          className="w-full mt-4"
        >
          {showDetails ? t('hideDetails') : t('showDetails')}
        </Button>
      </Card>
    );
  }

  // No score available
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-gray-400" />
          {t('leadScore')}
        </h3>
        {onGenerateScore && (
          <Button onClick={onGenerateScore} disabled={isGenerating} size="sm">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                {t('generateScore')}
              </>
            )}
          </Button>
        )}
      </div>
      <p className="text-sm text-gray-500">{t('noScoreAvailable')}</p>
    </Card>
  );
}
