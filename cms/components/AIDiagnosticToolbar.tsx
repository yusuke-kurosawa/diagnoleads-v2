'use client';

/**
 * AI Diagnostic Toolbar Component for Payload CMS Admin
 *
 * Provides AI-assisted diagnostic question generation within the admin UI
 */

import { useCallback, useState } from 'react';

interface GeneratedQuestion {
  questionText: { ja: string; en: string };
  questionType: 'single' | 'multiple' | 'scale';
  options?: Array<{
    label: { ja: string; en: string };
    value: string;
    score: number;
  }>;
}

interface GenerateResponse {
  success: boolean;
  content?: GeneratedQuestion[];
  error?: string;
}

export const AIDiagnosticToolbar: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);

  const handleGenerateQuestions = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedQuestions([]);

    try {
      const response = await fetch('/api/cms/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'diagnostic-questions',
          context: {
            topic: topic,
            count: 5,
          },
        }),
      });

      const result: GenerateResponse = await response.json();

      if (result.success && result.content) {
        setGeneratedQuestions(result.content);
        setSuccess(`Generated ${result.content.length} questions! Copy the ones you want to use.`);
      } else {
        setError(result.error || 'Failed to generate questions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [topic]);

  return (
    <div
      style={{
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #bfdbfe',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h.01" />
          <path d="M8.5 16a3.5 3.5 0 1 1 7 0c0 1.5-1 2-2 2.5V20h-3v-1.5c-1-.5-2-1-2-2.5z" />
          <path d="M12 2a8 8 0 0 0-6.67 12.5" />
          <path d="M18.67 14.5A8 8 0 0 0 12 2" />
        </svg>
        <span style={{ fontWeight: 600, color: '#1e293b' }}>AI Diagnostic Question Generator</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic (e.g., 'Marketing Readiness Assessment')"
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
          onClick={handleGenerateQuestions}
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
            backgroundColor: '#2563eb',
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
          {isLoading ? 'Generating...' : 'Generate Questions'}
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
            marginBottom: '12px',
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
            marginBottom: '12px',
          }}
        >
          {success}
        </div>
      )}

      {generatedQuestions.length > 0 && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 500 }}>
              Generated Questions (Copy to use)
            </span>
          </div>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {generatedQuestions.map((q, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  borderBottom:
                    index < generatedQuestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: '4px', fontSize: '13px' }}>
                  {index + 1}. {q.questionText.en}
                </div>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>
                  {q.questionText.ja}
                </div>
                {q.options && (
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Options: {q.options.map((o) => `${o.label.en} (${o.score}pts)`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDiagnosticToolbar;
