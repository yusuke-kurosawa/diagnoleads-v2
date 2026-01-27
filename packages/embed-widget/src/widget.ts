import { createStyles } from './styles';
import type {
  DiagnosticQuestion,
  DiagnosticResult,
  DiagnosticTemplate,
  LeadSubmissionData,
  WidgetError,
  WidgetState,
} from './types';

/**
 * DiagnoLeads Web Component
 * A self-contained widget for embedding diagnostic forms
 */
export class DiagnoLeadsWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private state: WidgetState = 'loading';
  private template: DiagnosticTemplate | null = null;
  private currentStepIndex = 0;
  private responses: Record<string, unknown> = {};
  private csrfToken = '';

  // Observed attributes
  static get observedAttributes() {
    return [
      'api-key',
      'api-url',
      'template-id',
      'primary-color',
      'background-color',
      'text-color',
      'border-radius',
    ];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  // Attribute getters
  get apiKey(): string {
    return this.getAttribute('api-key') || '';
  }

  get apiUrl(): string {
    return this.getAttribute('api-url') || window.location.origin;
  }

  get templateId(): string {
    return this.getAttribute('template-id') || '';
  }

  get primaryColor(): string {
    return this.getAttribute('primary-color') || '#3b82f6';
  }

  get backgroundColor(): string {
    return this.getAttribute('background-color') || '#ffffff';
  }

  get textColor(): string {
    return this.getAttribute('text-color') || '#1f2937';
  }

  get borderRadius(): string {
    return this.getAttribute('border-radius') || 'md';
  }

  connectedCallback() {
    this.render();
    this.loadTemplate();
  }

  disconnectedCallback() {
    // Cleanup if needed
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.render();
      if (name === 'api-key' || name === 'template-id') {
        this.loadTemplate();
      }
    }
  }

  private async loadTemplate() {
    if (!this.apiKey) {
      this.handleError({ code: 'MISSING_API_KEY', message: 'API key is required' });
      return;
    }

    this.state = 'loading';
    this.render();

    try {
      const url = new URL('/api/embed/v1/diagnostic', this.apiUrl);
      if (this.templateId) {
        url.searchParams.set('templateId', this.templateId);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      this.template = data.template;
      this.csrfToken = data.csrfToken;
      this.state = 'ready';
      this.dispatchEvent(new CustomEvent('load', { detail: this.template }));
    } catch (error) {
      this.handleError({
        code: 'LOAD_FAILED',
        message: error instanceof Error ? error.message : 'Failed to load template',
      });
    }

    this.render();
  }

  private async submitLead() {
    if (!this.template || !this.csrfToken) return;

    this.state = 'submitting';
    this.render();

    try {
      const leadData: LeadSubmissionData = {
        email: this.responses['email'] as string,
        name: this.responses['name'] as string,
        company: this.responses['company'] as string,
        phone: this.responses['phone'] as string,
        responses: this.responses,
        csrfToken: this.csrfToken,
      };

      this.dispatchEvent(new CustomEvent('submit', { detail: leadData }));

      const response = await fetch(`${this.apiUrl}/api/embed/v1/lead`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.csrfToken,
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const result: DiagnosticResult = await response.json();
      this.state = 'complete';
      this.dispatchEvent(new CustomEvent('complete', { detail: result }));
    } catch (error) {
      this.handleError({
        code: 'SUBMIT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to submit',
      });
    }

    this.render();
  }

  private handleError(error: WidgetError) {
    this.state = 'error';
    this.dispatchEvent(new CustomEvent('error', { detail: error }));
  }

  private handleInputChange(questionId: string, value: unknown) {
    this.responses[questionId] = value;
  }

  private goToNextStep() {
    if (!this.template) return;
    if (this.currentStepIndex < this.template.steps.length - 1) {
      this.currentStepIndex++;
      this.render();
    } else {
      this.submitLead();
    }
  }

  private goToPreviousStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.render();
    }
  }

  private render() {
    const borderRadiusValue = this.getBorderRadiusValue();
    const styles = createStyles({
      primaryColor: this.primaryColor,
      backgroundColor: this.backgroundColor,
      textColor: this.textColor,
      borderRadius: borderRadiusValue,
    });

    this.shadow.innerHTML = `
      <style>${styles}</style>
      <div class="widget-container">
        ${this.renderContent()}
      </div>
    `;

    this.attachEventListeners();
  }

  private getBorderRadiusValue(): string {
    const radiusMap: Record<string, string> = {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
    };
    return radiusMap[this.borderRadius] || '0.5rem';
  }

  private renderContent(): string {
    switch (this.state) {
      case 'loading':
        return this.renderLoading();
      case 'ready':
        return this.renderForm();
      case 'submitting':
        return this.renderSubmitting();
      case 'complete':
        return this.renderComplete();
      case 'error':
        return this.renderError();
      default:
        return '';
    }
  }

  private renderLoading(): string {
    return `
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading diagnostic...</p>
      </div>
    `;
  }

  private renderSubmitting(): string {
    return `
      <div class="loading">
        <div class="spinner"></div>
        <p>Submitting your responses...</p>
      </div>
    `;
  }

  private renderComplete(): string {
    return `
      <div class="complete">
        <div class="success-icon">✓</div>
        <h2>Thank you!</h2>
        <p>Your diagnostic has been submitted successfully.</p>
      </div>
    `;
  }

  private renderError(): string {
    return `
      <div class="error">
        <div class="error-icon">!</div>
        <h2>Something went wrong</h2>
        <p>Please try again later.</p>
        <button class="btn btn-primary retry-btn">Retry</button>
      </div>
    `;
  }

  private renderForm(): string {
    if (!this.template) return '';

    const currentStep = this.template.steps[this.currentStepIndex];
    const isFirstStep = this.currentStepIndex === 0;
    const isLastStep = this.currentStepIndex === this.template.steps.length - 1;
    const progress = ((this.currentStepIndex + 1) / this.template.steps.length) * 100;

    return `
      <div class="form-container">
        <header class="form-header">
          <h1>${this.escapeHtml(this.template.title)}</h1>
          ${this.template.description ? `<p>${this.escapeHtml(this.template.description)}</p>` : ''}
        </header>
        
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="step-indicator">Step ${this.currentStepIndex + 1} of ${this.template.steps.length}</div>
        
        <form class="diagnostic-form" id="diagnostic-form">
          <div class="step">
            <h2>${this.escapeHtml(currentStep.title)}</h2>
            ${currentStep.description ? `<p class="step-desc">${this.escapeHtml(currentStep.description)}</p>` : ''}
            
            <div class="questions">
              ${currentStep.questions.map((q) => this.renderQuestion(q)).join('')}
            </div>
          </div>
          
          <div class="form-actions">
            ${!isFirstStep ? '<button type="button" class="btn btn-secondary prev-btn">Back</button>' : ''}
            <button type="submit" class="btn btn-primary next-btn">
              ${isLastStep ? 'Submit' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    `;
  }

  private renderQuestion(question: DiagnosticQuestion): string {
    const currentValue = this.responses[question.id] ?? '';
    const requiredMark = question.required ? '<span class="required">*</span>' : '';

    let input = '';

    switch (question.type) {
      case 'text':
      case 'email':
      case 'phone':
        input = `
          <input
            type="${question.type === 'phone' ? 'tel' : question.type}"
            id="${question.id}"
            name="${question.id}"
            value="${this.escapeHtml(String(currentValue))}"
            placeholder="${this.escapeHtml(question.placeholder || '')}"
            ${question.required ? 'required' : ''}
            class="input"
          />
        `;
        break;

      case 'number':
        input = `
          <input
            type="number"
            id="${question.id}"
            name="${question.id}"
            value="${currentValue}"
            ${question.validation?.min !== undefined ? `min="${question.validation.min}"` : ''}
            ${question.validation?.max !== undefined ? `max="${question.validation.max}"` : ''}
            ${question.required ? 'required' : ''}
            class="input"
          />
        `;
        break;

      case 'textarea':
        input = `
          <textarea
            id="${question.id}"
            name="${question.id}"
            placeholder="${this.escapeHtml(question.placeholder || '')}"
            ${question.required ? 'required' : ''}
            class="input textarea"
          >${this.escapeHtml(String(currentValue))}</textarea>
        `;
        break;

      case 'select':
        input = `
          <select id="${question.id}" name="${question.id}" ${question.required ? 'required' : ''} class="input select">
            <option value="">Select an option</option>
            ${(question.options || [])
              .map(
                (opt) => `
              <option value="${this.escapeHtml(opt.value)}" ${currentValue === opt.value ? 'selected' : ''}>
                ${this.escapeHtml(opt.label)}
              </option>
            `
              )
              .join('')}
          </select>
        `;
        break;

      case 'radio':
        input = `
          <div class="radio-group">
            ${(question.options || [])
              .map(
                (opt) => `
              <label class="radio-label">
                <input
                  type="radio"
                  name="${question.id}"
                  value="${this.escapeHtml(opt.value)}"
                  ${currentValue === opt.value ? 'checked' : ''}
                  ${question.required ? 'required' : ''}
                />
                <span>${this.escapeHtml(opt.label)}</span>
              </label>
            `
              )
              .join('')}
          </div>
        `;
        break;

      case 'checkbox':
        const checkedValues = Array.isArray(currentValue) ? currentValue : [];
        input = `
          <div class="checkbox-group">
            ${(question.options || [])
              .map(
                (opt) => `
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  name="${question.id}"
                  value="${this.escapeHtml(opt.value)}"
                  ${checkedValues.includes(opt.value) ? 'checked' : ''}
                />
                <span>${this.escapeHtml(opt.label)}</span>
              </label>
            `
              )
              .join('')}
          </div>
        `;
        break;

      case 'date':
        input = `
          <input
            type="date"
            id="${question.id}"
            name="${question.id}"
            value="${currentValue}"
            ${question.required ? 'required' : ''}
            class="input"
          />
        `;
        break;
    }

    return `
      <div class="question">
        <label for="${question.id}" class="label">
          ${this.escapeHtml(question.label)} ${requiredMark}
        </label>
        ${question.description ? `<p class="help-text">${this.escapeHtml(question.description)}</p>` : ''}
        ${input}
      </div>
    `;
  }

  private attachEventListeners() {
    // Form submission
    const form = this.shadow.querySelector('#diagnostic-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.collectFormData();
      this.goToNextStep();
    });

    // Previous button
    const prevBtn = this.shadow.querySelector('.prev-btn');
    prevBtn?.addEventListener('click', () => this.goToPreviousStep());

    // Retry button
    const retryBtn = this.shadow.querySelector('.retry-btn');
    retryBtn?.addEventListener('click', () => this.loadTemplate());

    // Input changes
    const inputs = this.shadow.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const name = target.name;

        if (target.type === 'checkbox') {
          const checkboxes = this.shadow.querySelectorAll(
            `input[name="${name}"]:checked`
          ) as NodeListOf<HTMLInputElement>;
          const values = Array.from(checkboxes).map((cb) => cb.value);
          this.handleInputChange(name, values);
        } else {
          this.handleInputChange(name, target.value);
        }
      });
    });
  }

  private collectFormData() {
    const form = this.shadow.querySelector('#diagnostic-form') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    formData.forEach((value, key) => {
      // Handle checkboxes separately (already handled in change event)
      const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement;
      if (input?.type !== 'checkbox') {
        this.responses[key] = value;
      }
    });
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
