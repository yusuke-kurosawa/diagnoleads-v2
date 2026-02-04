/**
 * OpenAPI Generator
 *
 * Generates OpenAPI specification from API definitions
 */

import type {
  OpenAPIObject,
  PathItemObject,
  OperationObject,
  SchemaObject,
} from 'openapi3-ts/oas30';
import type { ApiEndpoint, ApiModule, DocConfig } from './types';
import { DEFAULT_DOC_CONFIG, COMMON_SCHEMAS, API_TAGS } from './types';

/**
 * OpenAPI Generator class
 */
export class OpenAPIGenerator {
  private config: DocConfig;
  private modules: ApiModule[] = [];
  private additionalSchemas: Record<string, SchemaObject> = {};

  constructor(config: Partial<DocConfig> = {}) {
    this.config = { ...DEFAULT_DOC_CONFIG, ...config };
  }

  /**
   * Register an API module
   */
  registerModule(module: ApiModule): void {
    this.modules.push(module);
    if (module.schemas) {
      Object.assign(this.additionalSchemas, module.schemas);
    }
  }

  /**
   * Register a schema
   */
  registerSchema(name: string, schema: SchemaObject): void {
    this.additionalSchemas[name] = schema;
  }

  /**
   * Generate OpenAPI specification
   */
  generate(): OpenAPIObject {
    const paths: Record<string, PathItemObject> = {};

    // Process all modules
    for (const module of this.modules) {
      for (const endpoint of module.endpoints) {
        const pathItem = paths[endpoint.path] ?? {};
        pathItem[endpoint.method] = this.endpointToOperation(endpoint, module);
        paths[endpoint.path] = pathItem;
      }
    }

    return {
      openapi: '3.0.3',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description,
        contact: this.config.contact,
        license: this.config.license,
      },
      servers: this.config.servers,
      tags: API_TAGS.map((tag) => ({ name: tag.name, description: tag.description })),
      paths,
      components: {
        schemas: {
          ...COMMON_SCHEMAS,
          ...this.additionalSchemas,
        },
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'session',
          },
        },
      },
    };
  }

  /**
   * Generate JSON string
   */
  toJSON(pretty = true): string {
    const spec = this.generate();
    return pretty ? JSON.stringify(spec, null, 2) : JSON.stringify(spec);
  }

  /**
   * Generate YAML string (basic implementation)
   */
  toYAML(): string {
    const spec = this.generate();
    return this.jsonToYaml(spec);
  }

  private endpointToOperation(endpoint: ApiEndpoint, module: ApiModule): OperationObject {
    const operation: OperationObject = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      deprecated: endpoint.deprecated,
      responses: {},
    };

    // Add security if required
    if (endpoint.security !== false) {
      operation.security = [{ bearerAuth: [] }, { cookieAuth: [] }];
    }

    // Add parameters
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      operation.parameters = endpoint.parameters.map((param) => ({
        name: param.name,
        in: param.in,
        description: param.description,
        required: param.required,
        schema: param.schema,
      }));
    }

    // Add request body
    if (endpoint.requestBody) {
      operation.requestBody = {
        description: endpoint.requestBody.description,
        required: endpoint.requestBody.required ?? true,
        content: {
          'application/json': {
            schema: endpoint.requestBody.schema,
          },
        },
      };
    }

    // Add responses
    for (const [status, response] of Object.entries(endpoint.responses)) {
      operation.responses[status] = {
        description: response.description,
        ...(response.schema && {
          content: {
            'application/json': {
              schema: response.schema,
            },
          },
        }),
        ...(response.headers && { headers: response.headers }),
      };
    }

    return operation;
  }

  private jsonToYaml(obj: unknown, indent = 0): string {
    const spaces = '  '.repeat(indent);

    if (obj === null || obj === undefined) {
      return 'null';
    }

    if (typeof obj === 'string') {
      if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
        return `|\n${obj
          .split('\n')
          .map((line) => `${spaces}  ${line}`)
          .join('\n')}`;
      }
      return obj;
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj
        .map((item) => `${spaces}- ${this.jsonToYaml(item, indent + 1).trimStart()}`)
        .join('\n');
    }

    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      return entries
        .map(([key, value]) => {
          const yamlValue = this.jsonToYaml(value, indent + 1);
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return `${spaces}${key}:\n${yamlValue}`;
          }
          return `${spaces}${key}: ${yamlValue}`;
        })
        .join('\n');
    }

    return String(obj);
  }
}

/**
 * Create a new OpenAPI generator
 */
export function createOpenAPIGenerator(config?: Partial<DocConfig>): OpenAPIGenerator {
  return new OpenAPIGenerator(config);
}

/**
 * Quick generate OpenAPI from modules
 */
export function generateOpenAPI(modules: ApiModule[], config?: Partial<DocConfig>): OpenAPIObject {
  const generator = new OpenAPIGenerator(config);
  for (const module of modules) {
    generator.registerModule(module);
  }
  return generator.generate();
}
