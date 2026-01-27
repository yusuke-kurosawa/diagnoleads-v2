'use client';

/**
 * AI Generate Button Component for Payload CMS Admin
 *
 * Provides AI content generation within the Payload admin UI
 * Supports: Blog ideas, FAQ generation, SEO optimization, translation
 */

import { useDocumentInfo, useField } from '@payloadcms/ui';
import { useState } from 'react';

interface AIGenerateButtonProps {
  path: string;
  generateType: 'blog-idea' | 'faq' | 'seo' | 'translate' | 'diagnostic-questions';
  targetLocale?: 'ja' | 'en';
  sourceField?: string;
}

interface GenerateResponse {
  success: boolean;
  content?: string | Record<string, unknown>;
  error?: string;
}

export const AIGenerateButton: React.FC<AIGenerateButtonProps> = ({
  path,
  generateType,
  targetLocale = 'ja',
  sourceField,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { value, setValue } = useField<string>({ path });
  const documentInfo = useDocumentInfo();

  const getButtonLabel = () => {
    switch (generateType) {
      case 'blog-idea':
        return 'AI: Generate Blog Idea';
      case 'faq':
        return 'AI: Generate FAQ';
      case 'seo':
        return 'AI: Optimize SEO';
      case 'translate':
        return `AI: Translate to ${targetLocale === 'ja' ? 'Japanese' : 'English'}`;
      case 'diagnostic-questions':
        return 'AI: Generate Questions';
      default:
        return 'AI Generate';
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cms/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: generateType,
          targetLocale,
          sourceContent: sourceField ? documentInfo?.initialData?.[sourceField] : value,
          context: {
            collectionSlug: documentInfo?.collectionSlug,
            id: documentInfo?.id,
          },
        }),
      });

      const result: GenerateResponse = await response.json();

      if (result.success && result.content) {
        if (typeof result.content === 'string') {
          setValue(result.content);
        }
      } else {
        setError(result.error || 'Failed to generate content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-generate-container" style={{ marginTop: '8px' }}>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isLoading}
        className="btn btn--style-secondary btn--size-small"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '13px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          backgroundColor: '#6366f1',
          color: 'white',
          border: 'none',
        }}
      >
        {isLoading ? (
          <>
            <span className="spinner" style={{ width: '14px', height: '14px' }} />
            Generating...
          </>
        ) : (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            {getButtonLabel()}
          </>
        )}
      </button>
      {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
    </div>
  );
};

export default AIGenerateButton;
