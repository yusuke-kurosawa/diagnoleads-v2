/**
 * Figma Integration API for Payload CMS
 *
 * GET /api/cms/figma - Get Figma integration status
 * POST /api/cms/figma - Sync content from Figma
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  figmaClient,
  figmaSitesManager,
  getAllComponentMappings,
  getAllDesignTokens,
} from '@/lib/cms/integrations/figma';

/**
 * GET: Get Figma integration status and configuration
 */
export async function GET() {
  const isConfigured = figmaClient.isConfigured();

  return NextResponse.json({
    configured: isConfigured,
    mappings: getAllComponentMappings(),
    tokens: getAllDesignTokens(),
    pages: figmaSitesManager.getAllPages(),
  });
}

interface SyncRequest {
  action: 'sync-tokens' | 'sync-page' | 'get-file' | 'get-components' | 'export-images';
  fileId?: string;
  nodeId?: string;
  nodeIds?: string[];
  format?: 'png' | 'svg' | 'jpg';
}

/**
 * POST: Perform Figma sync operations
 */
export async function POST(request: NextRequest) {
  try {
    const body: SyncRequest = await request.json();
    const { action, fileId, nodeId, nodeIds, format = 'png' } = body;

    if (!figmaClient.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Figma API is not configured. Set FIGMA_ACCESS_TOKEN environment variable.',
        },
        { status: 503 }
      );
    }

    switch (action) {
      case 'get-file': {
        if (!fileId) {
          return NextResponse.json(
            { success: false, error: 'fileId is required' },
            { status: 400 }
          );
        }
        const file = await figmaClient.getFile(fileId);
        return NextResponse.json({
          success: true,
          data: {
            name: file.name,
            lastModified: file.lastModified,
            version: file.version,
          },
        });
      }

      case 'get-components': {
        if (!fileId) {
          return NextResponse.json(
            { success: false, error: 'fileId is required' },
            { status: 400 }
          );
        }
        const components = await figmaClient.getFileComponents(fileId);
        return NextResponse.json({
          success: true,
          data: components,
        });
      }

      case 'sync-tokens': {
        if (!fileId) {
          return NextResponse.json(
            { success: false, error: 'fileId is required' },
            { status: 400 }
          );
        }
        const tokens = await figmaClient.syncDesignTokens(fileId);
        return NextResponse.json({
          success: true,
          data: {
            synced: tokens.length,
            tokens,
          },
        });
      }

      case 'sync-page': {
        if (!fileId || !nodeId) {
          return NextResponse.json(
            { success: false, error: 'fileId and nodeId are required' },
            { status: 400 }
          );
        }
        const page = figmaSitesManager.getPage(fileId, nodeId);
        if (!page) {
          return NextResponse.json(
            { success: false, error: 'Page not registered' },
            { status: 404 }
          );
        }
        const { texts, mappings } = await figmaSitesManager.syncPageContent(page);
        return NextResponse.json({
          success: true,
          data: {
            texts,
            mappings,
            payloadData: figmaSitesManager.transformToPayloadData(texts, mappings, page.locale),
          },
        });
      }

      case 'export-images': {
        if (!fileId || !nodeIds || nodeIds.length === 0) {
          return NextResponse.json(
            { success: false, error: 'fileId and nodeIds are required' },
            { status: 400 }
          );
        }
        const images = await figmaClient.exportImages(fileId, nodeIds, format);
        return NextResponse.json({
          success: true,
          data: images,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Figma API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Figma operation failed',
      },
      { status: 500 }
    );
  }
}
