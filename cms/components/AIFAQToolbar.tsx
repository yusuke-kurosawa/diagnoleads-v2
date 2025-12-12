'use client';

/**
 * AI FAQ Toolbar Component for Payload CMS Admin
 *
 * Provides AI-assisted FAQ generation within the admin UI
 */

import { useForm } from '@payloadcms/ui';
import { useCallback, useState } from 'react';

interface GeneratedFAQ {
  question: { ja: string; en: string };
  answer: { ja: string; en: string };
  category: string;
}

interface GenerateResponse {
  success: boolean;
  content?: GeneratedFAQ[];
  error?: string;
}

export const AIFAQToolbar: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const { setModified, dispatchFields } = useForm();

  const handleGenerateFAQ = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first');
      return;
    }

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
          type: 'faq',
          context: {
            topic: topic,
            count: 1,
          },
        }),
      });

      const result: GenerateResponse = await response.json();

      if (result.success && result.content && result.content.length > 0) {
        const faq = result.content[0];

        // Update form fields with generated content
        dispatchFields({
          type: 'UPDATE',
          path: 'question',
          value: faq.question.en,
        });

        // Note: Rich text fields need special handling
        // For now, we'll show the success message with the generated answer
        setModified(true);
        setSuccess(
          `FAQ generated! Question updated. Answer: ${faq.answer.en.substring(0, 100)}...`
        );
      } else {
        setError(result.error || 'Failed to generate FAQ');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [topic, dispatchFields, setModified]);

  return (
    <div
      style={{
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#faf5ff',
        borderRadius: '8px',
        border: '1px solid #e9d5ff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9333ea"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        <span style={{ fontWeight: 600, color: '#1e293b' }}>AI FAQ Generator</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic (e.g., 'Lead Generation Features')"
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '13px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: 'white',
          }}
        />
        <button
          type="button"
          onClick={handleGenerateFAQ}
          disabled={isLoading || !topic.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '6px',
            cursor: isLoading || !topic.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !topic.trim() ? 0.6 : 1,
            backgroundColor: '#9333ea',
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
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
          {isLoading ? 'Generating...' : 'Generate FAQ'}
        </button>
      </div>

      {error && (
        <div
          style={{
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

export default AIFAQToolbar;
