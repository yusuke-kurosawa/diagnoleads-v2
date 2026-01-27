'use client';

/**
 * AI Generate Field Component for Payload CMS
 *
 * A custom field component that adds AI generation capabilities
 * to text/textarea fields in the Payload admin UI
 */

import type { TextFieldClientComponent, TextareaFieldClientComponent } from 'payload';
import { useCallback, useState } from 'react';

interface AIGenerateFieldProps {
  path: string;
  field: {
    name: string;
    label?: string;
    admin?: {
      description?: string;
    };
  };
}

type GenerateType = 'blog-idea' | 'faq' | 'seo' | 'translate';

interface GenerateResponse {
  success: boolean;
  content?: string | Record<string, unknown>;
  error?: string;
}

export const AIGenerateField: TextFieldClientComponent = (props) => {
  const { path } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(
    async (type: GenerateType, targetLocale: 'ja' | 'en' = 'ja') => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/cms/ai-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            targetLocale,
            context: {
              topic: 'Lead Generation',
            },
          }),
        });

        const result: GenerateResponse = await response.json();

        if (!result.success) {
          setError(result.error || 'Failed to generate content');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <div className="ai-generate-field">
      <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <AIButton
          onClick={() => handleGenerate('blog-idea')}
          disabled={isLoading}
          label="Generate Idea"
          icon="lightbulb"
        />
        <AIButton
          onClick={() => handleGenerate('seo')}
          disabled={isLoading}
          label="Optimize SEO"
          icon="search"
        />
        <AIButton
          onClick={() => handleGenerate('translate', 'en')}
          disabled={isLoading}
          label="Translate to EN"
          icon="globe"
        />
      </div>
      {isLoading && <div style={{ color: '#6366f1', fontSize: '12px' }}>Generating with AI...</div>}
      {error && <div style={{ color: '#ef4444', fontSize: '12px' }}>{error}</div>}
    </div>
  );
};

interface AIButtonProps {
  onClick: () => void;
  disabled: boolean;
  label: string;
  icon: 'lightbulb' | 'search' | 'globe' | 'sparkles';
}

function AIButton({ onClick, disabled, label, icon }: AIButtonProps) {
  const icons = {
    lightbulb: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 18h6M10 22h4M21 7c0 4-3 6-3 10H6c0-4-3-6-3-10a9 9 0 1 1 18 0z" />
      </svg>
    ),
    search: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    globe: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    sparkles: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        fontSize: '11px',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        backgroundColor: '#f3f4f6',
        color: '#374151',
        border: '1px solid #e5e7eb',
        transition: 'all 0.2s',
      }}
    >
      {icons[icon]}
      {label}
    </button>
  );
}

export default AIGenerateField;
