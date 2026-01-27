#!/usr/bin/env tsx
/**
 * OpenAPI Specification Generator
 *
 * The OpenAPI spec is maintained in openapi/openapi.json
 * This script validates and optionally serves the documentation.
 *
 * Run: bun run openapi:generate
 *
 * To view the documentation:
 *   npx @redocly/cli preview-docs openapi/openapi.json
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const openApiPath = join(process.cwd(), 'openapi', 'openapi.json');

if (!existsSync(openApiPath)) {
  console.error('❌ OpenAPI specification not found at:', openApiPath);
  process.exit(1);
}

try {
  const spec = JSON.parse(readFileSync(openApiPath, 'utf-8'));

  console.log(`
✅ OpenAPI Specification: ${openApiPath}

   Title: ${spec.info.title}
   Version: ${spec.info.version}
   Paths: ${Object.keys(spec.paths).length}
   Schemas: ${Object.keys(spec.components?.schemas || {}).length}

View documentation:
   npx @redocly/cli preview-docs openapi/openapi.json

Or use Swagger UI:
   npx swagger-ui-watcher openapi/openapi.json
  `);
} catch (error) {
  console.error('❌ Failed to parse OpenAPI specification:', error);
  process.exit(1);
}
