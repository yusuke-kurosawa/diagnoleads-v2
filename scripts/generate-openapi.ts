#!/usr/bin/env tsx
/**
 * Generate OpenAPI specification from tRPC routers
 * Run: npm run openapi:generate
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

const registry = new OpenAPIRegistry();

// TODO: Register your tRPC procedures here
// Example:
// registry.registerPath({
//   method: 'get',
//   path: '/api/health',
//   summary: 'Health check endpoint',
//   responses: {
//     200: {
//       description: 'Service is healthy',
//       content: {
//         'application/json': {
//           schema: z.object({
//             status: z.literal('ok'),
//             timestamp: z.string(),
//           }),
//         },
//       },
//     },
//   },
// });

const generator = new OpenApiGeneratorV3(registry.definitions);

const document = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'DiagnoLeads v2 API',
    version: '1.0.0',
    description: 'AI-Powered B2B Diagnostic Platform API',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://diagnoleads.com',
      description: 'Production server',
    },
  ],
});

// Create openapi directory if it doesn't exist
const openApiDir = join(process.cwd(), 'openapi');
mkdirSync(openApiDir, { recursive: true });

// Write OpenAPI spec to file
const outputPath = join(openApiDir, 'openapi.json');
writeFileSync(outputPath, JSON.stringify(document, null, 2));

console.log(`✅ OpenAPI specification generated at: ${outputPath}`);
