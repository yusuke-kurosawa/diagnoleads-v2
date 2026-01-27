'use client';

/**
 * AI Toolbar Component for Payload CMS Admin
 *
 * Provides a toolbar with AI content generation buttons
 * that can be used to generate content for various fields
 */

import { useDocumentInfo, useForm, useFormFields } from '@payloadcms/ui';
import { useCallback, useState } from 'react';

interface GenerateResponse {
  success: boolean;
  content?: {
    title?: { ja: string; en: string };
    excerpt?: { ja: string; en: string };
    outline?: string[];
    suggestedTags?: string[];
  };
  error?: string;
}

export const AIToolbar: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { setModified, dispatchFields } = useForm();
  const documentInfo = useDocumentInfo();

  const handleGenerateBlogIdea = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/cms/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'blog-idea',
          context: {
            topic: 'Lead Generation and Marketing Automation',
            keywords: ['lead generation', 'marketing', 'B2B', 'automation'],
          },
        }),
      });

      const result: GenerateResponse = await response.json();

      if (result.success && result.content) {
        // Update form fields with generated content
        if (result.content.title) {
          dispatchFields({
            type: 'UPDATE',
            path: 'title',
            value: result.content.title.en,
          });
        }
        if (result.content.excerpt) {
          dispatchFields({
            type: 'UPDATE',
            path: 'excerpt',
            value: result.content.excerpt.en,
          });
        }
        setModified(true);
        setSuccess('Content generated! Check the title and excerpt fields.');
      } else {
        setError(result.error || 'Failed to generate content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [dispatchFields, setModified]);

  const handleOptimizeSEO = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/cms/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'seo',
          sourceContent: documentInfo?.initialData?.content || '',
          context: {
            topic: documentInfo?.initialData?.title || 'Blog Post',
            keywords: ['lead generation', 'marketing'],
          },
        }),
      });

      const result = await response.json();

      if (result.success && result.content) {
        if (result.content.metaTitle) {
          dispatchFields({
            type: 'UPDATE',
            path: 'seo.metaTitle',
            value: result.content.metaTitle.en,
          });
        }
        if (result.content.metaDescription) {
          dispatchFields({
            type: 'UPDATE',
            path: 'seo.metaDescription',
            value: result.content.metaDescription.en,
          });
        }
        setModified(true);
        setSuccess('SEO metadata optimized!');
      } else {
        setError(result.error || 'Failed to optimize SEO');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [dispatchFields, setModified, documentInfo]);

  return (
    <div
      style={{
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
        <span style={{ fontWeight: 600, color: '#1e293b' }}>AI Content Assistant</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleGenerateBlogIdea}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            transition: 'all 0.2s',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18h6M10 22h4M21 7c0 4-3 6-3 10H6c0-4-3-6-3-10a9 9 0 1 1 18 0z" />
          </svg>
          {isLoading ? 'Generating...' : 'Generate Blog Idea'}
        </button>

        <button
          type="button"
          onClick={handleOptimizeSEO}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            transition: 'all 0.2s',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          {isLoading ? 'Optimizing...' : 'Optimize SEO'}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            color: '#16a34a',
            fontSize: '13px',
          }}
        >
          {success}
        </div>
      )}
    </div>
  );
};

export default AIToolbar;
