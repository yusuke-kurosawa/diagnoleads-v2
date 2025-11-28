'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSemanticSearch } from '@/hooks/use-ai';
import { ExternalLink, Loader2, Search, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

interface SemanticSearchProps {
  organizationId: string;
}

/**
 * Semantic Search Component
 * Natural language search for leads using AI embeddings
 */
export function SemanticSearch({ organizationId }: SemanticSearchProps) {
  const t = useTranslations('ai');
  const tCommon = useTranslations('common');
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Only execute search when searchQuery is set
  const { data: results, isLoading } = useSemanticSearch({
    organizationId,
    query: searchQuery,
    limit: 10,
    minSimilarity: 0.7,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchQuery('');
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          {t('semanticSearch')}
        </h3>
        <p className="text-sm text-gray-600">{t('semanticSearchDescription')}</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('semanticSearchPlaceholder')}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={!query.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {tCommon('searching')}
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                {tCommon('search')}
              </>
            )}
          </Button>
          {searchQuery && (
            <Button type="button" variant="outline" onClick={handleClear}>
              {tCommon('clear')}
            </Button>
          )}
        </div>
      </form>

      {/* Search results */}
      {searchQuery && (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                {t('searchResultsCount', { count: results.length })}
              </div>
              {results.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/${organizationId}/leads/${lead.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {lead.name || lead.email}
                      </div>
                      {lead.company && (
                        <div className="text-sm text-gray-600 truncate mt-1">{lead.company}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {lead.industry && <Badge variant="secondary">{lead.industry}</Badge>}
                        <span className="text-xs text-gray-500">{lead.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Similarity score */}
                      <div className="text-right">
                        <div className="text-sm font-medium text-purple-600">
                          {Math.round(lead.similarity * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">{t('match')}</div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">{t('noSearchResults')}</p>
              <p className="text-xs text-gray-400 mt-2">{t('noSearchResultsHint')}</p>
            </div>
          )}
        </div>
      )}

      {/* Example queries */}
      {!searchQuery && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">{t('exampleQueries')}:</p>
          <div className="flex flex-wrap gap-2">
            {[t('exampleQuery1'), t('exampleQuery2'), t('exampleQuery3')].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setQuery(example);
                  setSearchQuery(example);
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
