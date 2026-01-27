'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export interface WidgetConfig {
  id: string;
  enabled: boolean;
  order: number;
}

export interface WidgetDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
}

interface WidgetSettingsProps {
  widgets: WidgetDefinition[];
  config: WidgetConfig[];
  onConfigChange: (config: WidgetConfig[]) => void;
}

const STORAGE_KEY = 'dashboard-widget-config';

export function useWidgetConfig(
  defaultWidgets: string[]
): [WidgetConfig[], (config: WidgetConfig[]) => void] {
  const [config, setConfig] = useState<WidgetConfig[]>(() => {
    if (typeof window === 'undefined') {
      return defaultWidgets.map((id, index) => ({ id, enabled: true, order: index }));
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall back to default
      }
    }
    return defaultWidgets.map((id, index) => ({ id, enabled: true, order: index }));
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  }, [config]);

  return [config, setConfig];
}

export function WidgetSettings({ widgets, config, onConfigChange }: WidgetSettingsProps) {
  const t = useTranslations('dashboard.widgets');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<WidgetConfig[]>(config);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleToggle = (id: string, enabled: boolean) => {
    setLocalConfig((prev) => prev.map((item) => (item.id === id ? { ...item, enabled } : item)));
  };

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    setLocalConfig((prev) => {
      const draggedIndex = prev.findIndex((item) => item.id === draggedItem);
      const targetIndex = prev.findIndex((item) => item.id === targetId);

      const newConfig = [...prev];
      const [draggedWidget] = newConfig.splice(draggedIndex, 1);
      newConfig.splice(targetIndex, 0, draggedWidget);

      return newConfig.map((item, index) => ({ ...item, order: index }));
    });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultConfig = widgets.map((w, index) => ({
      id: w.id,
      enabled: true,
      order: index,
    }));
    setLocalConfig(defaultConfig);
  };

  const sortedWidgets = [...localConfig].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          {t('customize')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          {sortedWidgets.map((item) => {
            const widget = widgets.find((w) => w.id === item.id);
            if (!widget) return null;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  draggedItem === item.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                } cursor-move transition-colors`}
              >
                <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {widget.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                    {t(widget.titleKey)}
                  </Label>
                  <p className="text-xs text-gray-500 truncate">{t(widget.descriptionKey)}</p>
                </div>
                <Switch
                  id={item.id}
                  checked={item.enabled}
                  onCheckedChange={(checked) => handleToggle(item.id, checked)}
                />
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
            {t('reset')}
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            {tCommon('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DashboardWidget({
  id,
  config,
  children,
}: {
  id: string;
  config: WidgetConfig[];
  children: React.ReactNode;
}) {
  const widgetConfig = config.find((c) => c.id === id);

  if (!widgetConfig?.enabled) {
    return null;
  }

  return <>{children}</>;
}
