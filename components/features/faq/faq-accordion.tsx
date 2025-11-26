'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FAQ } from '@/lib/cms';
import { cn } from '@/lib/utils';

interface FAQAccordionProps {
  faqs: FAQ[];
  locale: string;
}

interface FAQItemProps {
  faq: FAQ;
  locale: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ faq, locale, isOpen, onToggle }: FAQItemProps) {
  const question = faq.question[locale as 'ja' | 'en'] || faq.question.en;
  const answer = faq.answer[locale as 'ja' | 'en'] || faq.answer.en;

  // RichTextContentをプレーンテキストに変換
  const answerText = answer.content
    .map((node) => {
      if ('content' in node && node.content) {
        return node.content.map((textNode) => textNode.text).join('');
      }
      return '';
    })
    .join('\n');

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        type="button"
        className="w-full py-4 flex items-center justify-between text-left group"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-gray-900 font-medium pr-4 group-hover:text-blue-600 transition-colors">
          {question}
        </span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}
      >
        <div className="text-gray-600 leading-relaxed whitespace-pre-line">
          {answerText}
        </div>
      </div>
    </div>
  );
}

export function FAQAccordion({ faqs, locale }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (faqs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No FAQs available.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 px-6">
      {faqs.map((faq) => (
        <FAQItem
          key={faq.id}
          faq={faq}
          locale={locale}
          isOpen={openId === faq.id}
          onToggle={() => handleToggle(faq.id)}
        />
      ))}
    </div>
  );
}
