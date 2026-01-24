/**
 * DiagnoLeads Embed Widget
 * A lightweight Web Component for embedding diagnostic forms on external websites
 */

import { DiagnoLeadsWidget } from './widget';
import type { DiagnoLeadsWidgetConfig } from './types';

// Register the custom element
if (!customElements.get('diagnoleads-widget')) {
  customElements.define('diagnoleads-widget', DiagnoLeadsWidget);
}

// Export for programmatic usage
export { DiagnoLeadsWidget };
export type { DiagnoLeadsWidgetConfig } from './types';

// Global initialization function
declare global {
  interface Window {
    DiagnoLeads: {
      init: (config: DiagnoLeadsWidgetConfig) => DiagnoLeadsWidget;
      version: string;
    };
  }
}

window.DiagnoLeads = {
  version: '1.0.0',
  init: (config: DiagnoLeadsWidgetConfig): DiagnoLeadsWidget => {
    const widget = document.createElement('diagnoleads-widget') as DiagnoLeadsWidget;

    if (config.apiKey) widget.setAttribute('api-key', config.apiKey);
    if (config.apiUrl) widget.setAttribute('api-url', config.apiUrl);
    if (config.templateId) widget.setAttribute('template-id', config.templateId);
    if (config.primaryColor) widget.setAttribute('primary-color', config.primaryColor);
    if (config.backgroundColor) widget.setAttribute('background-color', config.backgroundColor);
    if (config.textColor) widget.setAttribute('text-color', config.textColor);
    if (config.borderRadius) widget.setAttribute('border-radius', config.borderRadius);
    if (config.containerId) {
      const container = document.getElementById(config.containerId);
      if (container) {
        container.appendChild(widget);
      }
    }

    return widget;
  },
};
