# AI Features

AI-powered features for DiagnoLeads using Claude 4.5 Sonnet and OpenAI Embeddings.

## Features

### 1. Lead Scoring (`scoring/claude.ts`)
- AI-powered lead quality assessment
- Scores from 0-100 with confidence levels
- Actionable recommendations
- Priority classification

```typescript
import { scoreLeadWithAI } from '@/lib/features/ai';

const score = await scoreLeadWithAI({
  name: 'John Doe',
  company: 'Acme Corp',
  industry: 'Technology',
  position: 'CTO',
});

console.log(score.score); // 85
console.log(score.priority); // 'high'
console.log(score.recommendedActions); // ['Schedule demo call', ...]
```

### 2. Semantic Search (`search/semantic.ts`)
- Natural language search for leads
- Vector similarity matching
- Find similar leads

```typescript
import { semanticSearch, findSimilarLeads } from '@/lib/features/ai';

// Natural language search
const results = await semanticSearch(
  'tech companies in San Francisco',
  organizationId
);

// Find similar leads
const similar = await findSimilarLeads(leadId, organizationId);
```

### 3. Chat Assistant (`chat/assistant.ts`)
- Streaming AI responses
- Contextual lead insights
- Automated summaries

```typescript
import { generateChatResponse, generateLeadSummary } from '@/lib/features/ai';

// Chat with context
const response = await generateChatResponse(messages, {
  organizationName: 'Acme Inc',
  recentLeads: leads,
});

// Generate lead summary
const summary = await generateLeadSummary(lead);
```

### 4. Embeddings (`embeddings/openai.ts`)
- Text vectorization using OpenAI
- 1536-dimensional embeddings
- Batch processing support

```typescript
import { generateEmbedding, prepareLeadText } from '@/lib/features/ai';

const text = prepareLeadText(lead);
const embedding = await generateEmbedding(text);
```

## Database Setup

### Required PostgreSQL Extensions

Run the migrations to set up required extensions:

```bash
# Enable pgvector for vector search
psql -d diagnoleads_dev -f db/migrations/0005_add_pgvector_extension.sql

# Enable full-text search
psql -d diagnoleads_dev -f db/migrations/0006_add_pgroonga_fulltext_search.sql
```

### Schema

The AI features require the following table modifications:

- `leads.embedding` - Vector(1536) for semantic search
- `leads.search_vector` - tsvector for full-text search

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

## Implementation Status

Phase 3.1 ✅ Complete:
- [x] Vercel AI SDK integration
- [x] Anthropic Claude API setup
- [x] OpenAI Embeddings integration
- [x] pgvector extension migration
- [x] Full-text search migration
- [x] Core AI services implementation

Phase 3.2 🚧 In Progress:
- [ ] tRPC routes for AI features
- [ ] React hooks for AI features
- [ ] UI components for AI insights
- [ ] Background job for embedding generation
- [ ] Rate limiting and caching

## Performance Considerations

- **Embeddings**: Cached after generation, regenerated only on lead updates
- **AI Scoring**: Rate limited to prevent API overuse
- **Search**: HNSW index provides sub-linear time complexity
- **Batch Processing**: Process multiple leads concurrently with limits

## Cost Optimization

- Use `text-embedding-3-small` (lowest cost, sufficient quality)
- Cache AI responses for identical queries
- Batch API calls when possible
- Implement request deduplication
