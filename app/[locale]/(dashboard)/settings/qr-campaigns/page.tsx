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
  Copy,
  Download,
  Loader2,
  MoreVertical,
  Plus,
  QrCode,
  ScanLine,
  Target,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface QRCampaignFormData {
  name: string;
  description: string;
  diagnosticTemplateId: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
}

const DEFAULT_FORM_DATA: QRCampaignFormData = {
  name: '',
  description: '',
  diagnosticTemplateId: '',
  utmSource: 'qrcode',
  utmMedium: 'offline',
  utmCampaign: '',
  utmContent: '',
};

export default function QRCampaignsPage() {
  const t = useTranslations('settings');
  const { organization } = useOrganization();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<QRCampaignFormData>(DEFAULT_FORM_DATA);

  const utils = trpc.useUtils();

  // Fetch QR campaigns
  const { data: campaigns, isLoading } = trpc.distribution.listCampaigns.useQuery(
    { organizationId: organization?.id ?? '' },
    { enabled: !!organization?.id }
  );

  // Fetch diagnostic templates for selection
  const { data: templates } = trpc.diagnosticTemplates.list.useQuery(
    { organizationId: organization?.id ?? '' },
    { enabled: !!organization?.id }
  );

  // Create mutation
  const createMutation = trpc.distribution.createCampaign.useMutation({
    onSuccess: () => {
      toast.success('QR Campaign created successfully');
      utils.distribution.listCampaigns.invalidate();
      setIsCreateOpen(false);
      setFormData(DEFAULT_FORM_DATA);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create campaign');
    },
  });

  // Update mutation
  const updateMutation = trpc.distribution.updateCampaign.useMutation({
    onSuccess: () => {
      toast.success('Campaign updated');
      utils.distribution.listCampaigns.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update campaign');
    },
  });

  // Delete mutation
  const deleteMutation = trpc.distribution.deleteCampaign.useMutation({
    onSuccess: () => {
      toast.success('Campaign deleted');
      utils.distribution.listCampaigns.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete campaign');
    },
  });

  // Generate QR mutation for campaign
  const generateQRMutation = trpc.distribution.generateCampaignQR.useMutation({
    onSuccess: (data) => {
      // Download QR code as PNG
      const link = document.createElement('a');
      link.href = data.qrCode;
      link.download = `qr-${data.shortCode}.png`;
      link.click();
      toast.success('QR Code downloaded');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate QR code');
    },
  });

  const handleCreate = () => {
    if (!organization?.id || !formData.name || !formData.diagnosticTemplateId) {
      toast.error('Please fill in all required fields');
      return;
    }

    createMutation.mutate({
      organizationId: organization.id,
      ...formData,
    });
  };

  const handleToggleActive = (campaignId: string, isActive: boolean) => {
    if (!organization?.id) return;
    updateMutation.mutate({
      organizationId: organization.id,
      id: campaignId,
      data: { isActive: !isActive },
    });
  };

  const handleDelete = (campaignId: string) => {
    if (!organization?.id) return;
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    deleteMutation.mutate({
      organizationId: organization.id,
      id: campaignId,
    });
  };

  const handleDownloadQR = (campaignId: string) => {
    if (!organization?.id) return;
    generateQRMutation.mutate({
      organizationId: organization.id,
      campaignId,
      size: 'large',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QR Code Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage QR codes for offline distribution
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create QR Campaign</DialogTitle>
              <DialogDescription>
                Create a new QR code campaign for offline distribution
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Campaign Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Trade Show 2024"
                />
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the campaign purpose..."
                />
              </div>

              {/* Diagnostic Template */}
              <div className="grid gap-2">
                <Label htmlFor="template">Diagnostic Template *</Label>
                <Select
                  value={formData.diagnosticTemplateId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, diagnosticTemplateId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* UTM Parameters */}
              <div className="space-y-3">
                <Label>UTM Parameters</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="utmSource" className="text-xs text-muted-foreground">
                      Source
                    </Label>
                    <Input
                      id="utmSource"
                      value={formData.utmSource}
                      onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                      placeholder="qrcode"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="utmMedium" className="text-xs text-muted-foreground">
                      Medium
                    </Label>
                    <Input
                      id="utmMedium"
                      value={formData.utmMedium}
                      onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                      placeholder="offline"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="utmCampaign" className="text-xs text-muted-foreground">
                      Campaign
                    </Label>
                    <Input
                      id="utmCampaign"
                      value={formData.utmCampaign}
                      onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                      placeholder="trade-show-2024"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="utmContent" className="text-xs text-muted-foreground">
                      Content
                    </Label>
                    <Input
                      id="utmContent"
                      value={formData.utmContent}
                      onChange={(e) => setFormData({ ...formData, utmContent: e.target.value })}
                      placeholder="booth-banner"
                    />
                  </div>
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
                  createMutation.isPending || !formData.name || !formData.diagnosticTemplateId
                }
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns Grid */}
      {campaigns && campaigns.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className={!campaign.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={campaign.isActive}
                      onCheckedChange={() => handleToggleActive(campaign.id, campaign.isActive)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {campaign.description && (
                  <CardDescription className="mt-1">{campaign.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <ScanLine className="h-4 w-4 text-muted-foreground" />
                    <span>{campaign.scanCount} scans</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>{campaign.completionCount} conversions</span>
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="text-sm">
                  <span className="text-muted-foreground">Conversion Rate: </span>
                  <span className="font-medium">
                    {campaign.scanCount > 0
                      ? ((campaign.completionCount / campaign.scanCount) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>

                {/* Short Code */}
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-2 py-1 text-xs">
                    {campaign.shortCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(campaign.trackingUrl)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownloadQR(campaign.id)}
                    disabled={generateQRMutation.isPending}
                  >
                    {generateQRMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download QR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(campaign.trackingUrl)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <QrCode className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No QR Campaigns</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first QR code campaign for offline distribution
            </p>
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
