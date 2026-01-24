'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useOrganization } from '@/hooks/use-organization';
import { trpc } from '@/lib/trpc/client';
import {
  AlertCircle,
  Check,
  Code,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Key,
  Loader2,
  MoreVertical,
  Palette,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface EmbedFormData {
  name: string;
  description: string;
  allowedOrigins: string[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  diagnosticTemplateId?: string;
  leadSource: string;
  themeOverrides?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: BorderRadius;
  };
  customCss?: string;
}

const DEFAULT_FORM_DATA: EmbedFormData = {
  name: '',
  description: '',
  allowedOrigins: [],
  rateLimitPerMinute: 60,
  rateLimitPerDay: 10000,
  leadSource: 'embed',
};

// Preset configurations for quick setup
const EMBED_PRESETS: Record<
  string,
  Partial<EmbedFormData> & { label: string; description: string }
> = {
  minimal: {
    label: 'Minimal',
    description: 'Simple setup with default styling',
    rateLimitPerMinute: 30,
    rateLimitPerDay: 5000,
    themeOverrides: {
      borderRadius: 'md',
    },
  },
  branded: {
    label: 'Branded',
    description: 'Customizable colors for brand consistency',
    rateLimitPerMinute: 60,
    rateLimitPerDay: 10000,
    themeOverrides: {
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderRadius: 'lg',
    },
  },
  highVolume: {
    label: 'High Volume',
    description: 'Higher rate limits for busy sites',
    rateLimitPerMinute: 120,
    rateLimitPerDay: 50000,
    themeOverrides: {
      borderRadius: 'md',
    },
  },
  secure: {
    label: 'Secure',
    description: 'Strict rate limits and minimal styling',
    rateLimitPerMinute: 20,
    rateLimitPerDay: 2000,
    themeOverrides: {
      borderRadius: 'sm',
    },
  },
};

export default function EmbedSettingsPage() {
  const t = useTranslations('settings');
  const { organization } = useOrganization();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [newOrigin, setNewOrigin] = useState('');
  const [formData, setFormData] = useState<EmbedFormData>(DEFAULT_FORM_DATA);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Fetch embed configs
  const { data: embedConfigs, isLoading } = trpc.embed.list.useQuery(
    { organizationId: organization?.id ?? '' },
    { enabled: !!organization?.id }
  );

  // Fetch diagnostic templates for selection
  const { data: templates } = trpc.diagnosticTemplates.list.useQuery(
    { organizationId: organization?.id ?? '' },
    { enabled: !!organization?.id }
  );

  // Mutations
  const createConfig = trpc.embed.create.useMutation({
    onSuccess: (data) => {
      utils.embed.list.invalidate();
      setNewApiKey(data.apiKey ?? null);
      toast.success('Embed configuration created');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateConfig = trpc.embed.update.useMutation({
    onSuccess: () => {
      utils.embed.list.invalidate();
      toast.success('Configuration updated');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteConfig = trpc.embed.delete.useMutation({
    onSuccess: () => {
      utils.embed.list.invalidate();
      setIsDetailOpen(null);
      toast.success('Configuration deleted');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const regenerateApiKey = trpc.embed.regenerateApiKey.useMutation({
    onSuccess: (data) => {
      utils.embed.list.invalidate();
      setNewApiKey(data.apiKey ?? null);
      toast.success('API key regenerated');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = () => {
    if (!organization?.id) return;
    if (formData.allowedOrigins.length === 0) {
      toast.error('At least one allowed origin is required');
      return;
    }

    createConfig.mutate({
      organizationId: organization.id,
      name: formData.name,
      description: formData.description || undefined,
      allowedOrigins: formData.allowedOrigins,
      rateLimitPerMinute: formData.rateLimitPerMinute,
      rateLimitPerDay: formData.rateLimitPerDay,
      diagnosticTemplateId: formData.diagnosticTemplateId,
      leadSource: formData.leadSource,
      themeOverrides: formData.themeOverrides,
      customCss: formData.customCss,
    });
  };

  const handleAddOrigin = () => {
    if (!newOrigin) return;
    try {
      // Validate URL or wildcard pattern
      if (!newOrigin.includes('*')) {
        new URL(newOrigin);
      }
      if (!formData.allowedOrigins.includes(newOrigin)) {
        setFormData((prev) => ({
          ...prev,
          allowedOrigins: [...prev.allowedOrigins, newOrigin],
        }));
      }
      setNewOrigin('');
    } catch {
      toast.error('Invalid URL format');
    }
  };

  const handleRemoveOrigin = (origin: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedOrigins: prev.allowedOrigins.filter((o) => o !== origin),
    }));
  };

  const handleDelete = (id: string) => {
    if (!organization?.id) return;
    if (!confirm('Are you sure you want to delete this embed configuration?')) return;

    deleteConfig.mutate({
      organizationId: organization.id,
      id,
    });
  };

  const handleRegenerateApiKey = (id: string) => {
    if (!organization?.id) return;
    if (
      !confirm(
        'Are you sure? The current API key will stop working immediately. This action cannot be undone.'
      )
    )
      return;

    regenerateApiKey.mutate({
      organizationId: organization.id,
      id,
    });
  };

  const handleToggleActive = (id: string, currentState: boolean) => {
    if (!organization?.id) return;

    updateConfig.mutate({
      organizationId: organization.id,
      id,
      data: { isActive: !currentState },
    });
  };

  const copyToClipboard = (text: string, label: string = 'Copied') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  type EmbedConfig = NonNullable<typeof embedConfigs>[number];

  const generateEmbedCode = (config: EmbedConfig) => {
    return `<!-- DiagnoLeads Embed Widget -->
<script src="https://cdn.diagnoleads.com/widget/v1/widget.umd.js"></script>
<diagnoleads-widget
  api-key="${config.maskedApiKey}"
  api-url="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.diagnoleads.com'}"
  ${config.themeOverrides?.primaryColor ? `primary-color="${config.themeOverrides.primaryColor}"` : ''}
></diagnoleads-widget>`;
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setNewOrigin('');
    setNewApiKey(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Embed Widget Settings</h1>
          <p className="text-muted-foreground">
            Configure widgets to embed diagnostic forms on external websites
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="embed/analytics">
            <Button variant="outline">
              <Globe className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href="embed/logs">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Logs
            </Button>
          </Link>
          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Embed Configuration</DialogTitle>
                <DialogDescription>
                  Create a new embed widget configuration for external websites
                </DialogDescription>
              </DialogHeader>

              {newApiKey ? (
                // Show API key after creation
                <div className="py-6">
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                          Save your API key now
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          This is the only time you will see this API key. Please copy and store it
                          securely.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>API Key</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                        {newApiKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(newApiKey, 'API key copied')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button
                      onClick={() => {
                        setIsCreateOpen(false);
                        resetForm();
                      }}
                    >
                      Done
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                // Creation form
                <div className="grid gap-6 py-4">
                  {/* Presets */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Quick Start Presets</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(EMBED_PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          type="button"
                          className="text-left p-3 rounded-lg border hover:border-primary hover:bg-accent transition-colors"
                          onClick={() => {
                            const { label, description, ...presetData } = preset;
                            setFormData((prev) => ({
                              ...prev,
                              ...presetData,
                              themeOverrides: {
                                ...prev.themeOverrides,
                                ...presetData.themeOverrides,
                              },
                            }));
                            toast.success(`Applied "${label}" preset`);
                          }}
                        >
                          <p className="text-sm font-medium">{preset.label}</p>
                          <p className="text-xs text-muted-foreground">{preset.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Basic Information
                    </h3>
                    <div className="grid gap-4 pl-6">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Configuration Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="e.g., Company Website Widget"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="Optional description for this configuration"
                          rows={2}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="leadSource">Lead Source Tag</Label>
                        <Input
                          id="leadSource"
                          value={formData.leadSource}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, leadSource: e.target.value }))
                          }
                          placeholder="embed"
                        />
                        <p className="text-xs text-muted-foreground">
                          This tag will be used to identify leads from this widget
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Security & Allowed Origins *
                    </h3>
                    <div className="grid gap-4 pl-6">
                      <div className="grid gap-2">
                        <Label>Allowed Origins</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newOrigin}
                            onChange={(e) => setNewOrigin(e.target.value)}
                            placeholder="https://example.com or https://*.example.com"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddOrigin()}
                          />
                          <Button type="button" variant="outline" onClick={handleAddOrigin}>
                            Add
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Only requests from these origins will be accepted. Use * for wildcard
                          subdomains.
                        </p>
                        {formData.allowedOrigins.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.allowedOrigins.map((origin) => (
                              <Badge key={origin} variant="secondary" className="gap-1">
                                {origin}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOrigin(origin)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="rateLimitMinute">Rate Limit (per minute)</Label>
                          <Input
                            id="rateLimitMinute"
                            type="number"
                            min={1}
                            max={1000}
                            value={formData.rateLimitPerMinute}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                rateLimitPerMinute: Number.parseInt(e.target.value) || 60,
                              }))
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="rateLimitDay">Rate Limit (per day)</Label>
                          <Input
                            id="rateLimitDay"
                            type="number"
                            min={1}
                            max={100000}
                            value={formData.rateLimitPerDay}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                rateLimitPerDay: Number.parseInt(e.target.value) || 10000,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template Selection */}
                  {templates && templates.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Diagnostic Template
                      </h3>
                      <div className="pl-6">
                        <Select
                          value={formData.diagnosticTemplateId || ''}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              diagnosticTemplateId: value || undefined,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                          If not selected, the organization&apos;s default template will be used
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Theme Customization */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Theme Customization
                    </h3>
                    <div className="grid gap-4 pl-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="primaryColor">Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="primaryColor"
                              type="color"
                              className="w-12 h-9 p-1"
                              value={formData.themeOverrides?.primaryColor || '#3b82f6'}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  themeOverrides: {
                                    ...prev.themeOverrides,
                                    primaryColor: e.target.value,
                                  },
                                }))
                              }
                            />
                            <Input
                              value={formData.themeOverrides?.primaryColor || '#3b82f6'}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  themeOverrides: {
                                    ...prev.themeOverrides,
                                    primaryColor: e.target.value,
                                  },
                                }))
                              }
                              placeholder="#3b82f6"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="bgColor">Background Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="bgColor"
                              type="color"
                              className="w-12 h-9 p-1"
                              value={formData.themeOverrides?.backgroundColor || '#ffffff'}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  themeOverrides: {
                                    ...prev.themeOverrides,
                                    backgroundColor: e.target.value,
                                  },
                                }))
                              }
                            />
                            <Input
                              value={formData.themeOverrides?.backgroundColor || '#ffffff'}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  themeOverrides: {
                                    ...prev.themeOverrides,
                                    backgroundColor: e.target.value,
                                  },
                                }))
                              }
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="textColor">Text Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="textColor"
                              type="color"
                              className="w-12 h-9 p-1"
                              value={formData.themeOverrides?.textColor || '#1f2937'}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  themeOverrides: {
                                    ...prev.themeOverrides,
                                    textColor: e.target.value,
                                  },
                                }))
                              }
                            />
                            <Input
                              value={formData.themeOverrides?.textColor || '#1f2937'}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  themeOverrides: {
                                    ...prev.themeOverrides,
                                    textColor: e.target.value,
                                  },
                                }))
                              }
                              placeholder="#1f2937"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="borderRadius">Border Radius</Label>
                        <Select
                          value={formData.themeOverrides?.borderRadius || 'md'}
                          onValueChange={(value: BorderRadius) =>
                            setFormData((prev) => ({
                              ...prev,
                              themeOverrides: {
                                ...prev.themeOverrides,
                                borderRadius: value,
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="sm">Small</SelectItem>
                            <SelectItem value="md">Medium</SelectItem>
                            <SelectItem value="lg">Large</SelectItem>
                            <SelectItem value="xl">Extra Large</SelectItem>
                            <SelectItem value="full">Full (Rounded)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={
                        !formData.name ||
                        formData.allowedOrigins.length === 0 ||
                        createConfig.isPending
                      }
                    >
                      {createConfig.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Configuration
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Embed Configs List */}
      {embedConfigs && embedConfigs.length > 0 ? (
        <div className="grid gap-4">
          {embedConfigs.map((config) => (
            <Card key={config.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      {config.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {config.description && <CardDescription>{config.description}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.isActive}
                      onCheckedChange={() => handleToggleActive(config.id, config.isActive)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(config.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Key */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key
                  </h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                      {config.maskedApiKey}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateApiKey(config.id)}
                      disabled={regenerateApiKey.isPending}
                    >
                      {regenerateApiKey.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="ml-2">Regenerate</span>
                    </Button>
                  </div>
                </div>

                {/* Allowed Origins */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Allowed Origins
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {config.allowedOrigins.map((origin) => (
                      <Badge key={origin} variant="outline">
                        {origin}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Embed Code */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Embed Code
                  </h4>
                  <div className="relative">
                    <pre className="rounded bg-muted p-3 text-xs overflow-x-auto">
                      <code>{generateEmbedCode(config)}</code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        copyToClipboard(generateEmbedCode(config), 'Embed code copied')
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t">
                  <span>Usage: {config.usageCount.toLocaleString()} requests</span>
                  {config.lastUsedAt && (
                    <span>Last used: {new Date(config.lastUsedAt).toLocaleDateString()}</span>
                  )}
                  <span>Source: {config.leadSource}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Embed Configurations</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create an embed configuration to add diagnostic widgets to your external websites.
              Each configuration includes a unique API key and customizable settings.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Configuration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New API Key Dialog */}
      <Dialog open={!!newApiKey && !isCreateOpen} onOpenChange={() => setNewApiKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New API Key Generated</DialogTitle>
            <DialogDescription>
              Please copy and save this API key now. You won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  The previous API key has been invalidated. Update your embed code with this new
                  key.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                {newApiKey}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(newApiKey!, 'API key copied')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewApiKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
