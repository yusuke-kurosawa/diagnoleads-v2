/**
 * API Documentation Tests
 *
 * Unit tests for the OpenAPI generator
 */

import { describe, expect, it } from 'vitest';
import {
  OpenAPIGenerator,
  createOpenAPIGenerator,
  generateOpenAPI,
} from '@/lib/api-docs/generator';
import {
  getAllModules,
  systemModule,
  featureFlagsModule,
  auditLogsModule,
} from '@/lib/api-docs/modules';
import { DEFAULT_DOC_CONFIG, COMMON_SCHEMAS, API_TAGS } from '@/lib/api-docs/types';
import type { ApiModule } from '@/lib/api-docs/types';

describe('OpenAPIGenerator', () => {
  describe('constructor', () => {
    it('should use default config', () => {
      const generator = new OpenAPIGenerator();
      const spec = generator.generate();

      expect(spec.info.title).toBe(DEFAULT_DOC_CONFIG.title);
      expect(spec.info.version).toBe(DEFAULT_DOC_CONFIG.version);
    });

    it('should allow custom config', () => {
      const generator = new OpenAPIGenerator({
        title: 'Custom API',
        version: '2.0.0',
      });
      const spec = generator.generate();

      expect(spec.info.title).toBe('Custom API');
      expect(spec.info.version).toBe('2.0.0');
    });
  });

  describe('registerModule', () => {
    it('should register a module', () => {
      const generator = new OpenAPIGenerator();
      generator.registerModule(systemModule);
      const spec = generator.generate();

      expect(spec.paths['/api/health']).toBeDefined();
    });

    it('should register multiple modules', () => {
      const generator = new OpenAPIGenerator();
      generator.registerModule(systemModule);
      generator.registerModule(featureFlagsModule);
      const spec = generator.generate();

      expect(spec.paths['/api/health']).toBeDefined();
      expect(spec.paths['/api/trpc/featureFlags.list']).toBeDefined();
    });

    it('should include module schemas', () => {
      const generator = new OpenAPIGenerator();
      generator.registerModule(featureFlagsModule);
      const spec = generator.generate();

      expect(spec.components?.schemas?.FeatureFlag).toBeDefined();
    });
  });

  describe('registerSchema', () => {
    it('should register additional schemas', () => {
      const generator = new OpenAPIGenerator();
      generator.registerSchema('CustomType', {
        type: 'object',
        properties: { id: { type: 'string' } },
      });
      const spec = generator.generate();

      expect(spec.components?.schemas?.CustomType).toBeDefined();
    });
  });

  describe('generate', () => {
    it('should generate valid OpenAPI structure', () => {
      const generator = new OpenAPIGenerator();
      generator.registerModule(systemModule);
      const spec = generator.generate();

      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info).toBeDefined();
      expect(spec.servers).toBeDefined();
      expect(spec.paths).toBeDefined();
      expect(spec.components).toBeDefined();
    });

    it('should include common schemas', () => {
      const generator = new OpenAPIGenerator();
      const spec = generator.generate();

      expect(spec.components?.schemas?.Error).toBeDefined();
      expect(spec.components?.schemas?.Pagination).toBeDefined();
    });

    it('should include security schemes', () => {
      const generator = new OpenAPIGenerator();
      const spec = generator.generate();

      expect(spec.components?.securitySchemes?.bearerAuth).toBeDefined();
      expect(spec.components?.securitySchemes?.cookieAuth).toBeDefined();
    });

    it('should include all tags', () => {
      const generator = new OpenAPIGenerator();
      const spec = generator.generate();

      expect(spec.tags?.length).toBe(API_TAGS.length);
    });
  });

  describe('toJSON', () => {
    it('should output valid JSON', () => {
      const generator = new OpenAPIGenerator();
      generator.registerModule(systemModule);
      const json = generator.toJSON();

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should output pretty JSON by default', () => {
      const generator = new OpenAPIGenerator();
      const json = generator.toJSON();

      expect(json).toContain('\n');
    });

    it('should output minified JSON when requested', () => {
      const generator = new OpenAPIGenerator();
      const json = generator.toJSON(false);

      expect(json).not.toContain('\n  ');
    });
  });

  describe('toYAML', () => {
    it('should output YAML-like format', () => {
      const generator = new OpenAPIGenerator();
      generator.registerModule(systemModule);
      const yaml = generator.toYAML();

      expect(yaml).toContain('openapi:');
      expect(yaml).toContain('info:');
    });
  });
});

describe('createOpenAPIGenerator', () => {
  it('should create generator with config', () => {
    const generator = createOpenAPIGenerator({ title: 'Test' });
    const spec = generator.generate();

    expect(spec.info.title).toBe('Test');
  });
});

describe('generateOpenAPI', () => {
  it('should generate spec from modules', () => {
    const spec = generateOpenAPI([systemModule, featureFlagsModule]);

    expect(spec.paths['/api/health']).toBeDefined();
    expect(spec.paths['/api/trpc/featureFlags.list']).toBeDefined();
  });

  it('should work with all modules', () => {
    const spec = generateOpenAPI(getAllModules());

    expect(Object.keys(spec.paths).length).toBeGreaterThan(0);
  });
});

describe('Predefined Modules', () => {
  describe('systemModule', () => {
    it('should have health endpoint', () => {
      expect(systemModule.endpoints.some((e) => e.path === '/api/health')).toBe(true);
    });
  });

  describe('featureFlagsModule', () => {
    it('should have list and evaluate endpoints', () => {
      const paths = featureFlagsModule.endpoints.map((e) => e.path);

      expect(paths).toContain('/api/trpc/featureFlags.list');
      expect(paths).toContain('/api/trpc/featureFlags.evaluate');
    });

    it('should have FeatureFlag schema', () => {
      expect(featureFlagsModule.schemas?.FeatureFlag).toBeDefined();
    });
  });

  describe('auditLogsModule', () => {
    it('should have list and export endpoints', () => {
      const paths = auditLogsModule.endpoints.map((e) => e.path);

      expect(paths).toContain('/api/trpc/auditLogs.list');
      expect(paths).toContain('/api/trpc/auditLogs.export');
    });
  });

  describe('getAllModules', () => {
    it('should return all modules', () => {
      const modules = getAllModules();

      expect(modules.length).toBeGreaterThan(0);
      expect(modules.every((m) => m.name && m.endpoints)).toBe(true);
    });
  });
});

describe('DEFAULT_DOC_CONFIG', () => {
  it('should have required fields', () => {
    expect(DEFAULT_DOC_CONFIG.title).toBeDefined();
    expect(DEFAULT_DOC_CONFIG.version).toBeDefined();
    expect(DEFAULT_DOC_CONFIG.servers.length).toBeGreaterThan(0);
  });
});

describe('COMMON_SCHEMAS', () => {
  it('should have Error schema', () => {
    expect(COMMON_SCHEMAS.Error.type).toBe('object');
    expect(COMMON_SCHEMAS.Error.properties?.error).toBeDefined();
  });

  it('should have Pagination schema', () => {
    expect(COMMON_SCHEMAS.Pagination.properties?.page).toBeDefined();
    expect(COMMON_SCHEMAS.Pagination.properties?.limit).toBeDefined();
  });
});

describe('API_TAGS', () => {
  it('should have standard tags', () => {
    const names = API_TAGS.map((t) => t.name);

    expect(names).toContain('System');
    expect(names).toContain('Leads');
    expect(names).toContain('AI');
    expect(names).toContain('Feature Flags');
    expect(names).toContain('Audit Logs');
  });
});
