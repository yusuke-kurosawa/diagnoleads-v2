interface StyleConfig {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
}

export function createStyles(config: StyleConfig): string {
  const { primaryColor, backgroundColor, textColor, borderRadius } = config;

  // Calculate hover/active colors
  const primaryHover = adjustColor(primaryColor, -10);
  const primaryLight = adjustColor(primaryColor, 40);
  const borderColor = adjustColor(textColor, 70);
  const mutedText = adjustColor(textColor, 30);

  return `
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.5;
      color: ${textColor};
      -webkit-font-smoothing: antialiased;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .widget-container {
      background: ${backgroundColor};
      border-radius: ${borderRadius};
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      max-width: 600px;
      margin: 0 auto;
      overflow: hidden;
    }

    /* Loading & Status States */
    .loading, .complete, .error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid ${borderColor};
      border-top-color: ${primaryColor};
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .success-icon {
      width: 60px;
      height: 60px;
      background: ${primaryColor};
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .error-icon {
      width: 60px;
      height: 60px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }

    /* Form Container */
    .form-container {
      padding: 1.5rem;
    }

    .form-header {
      margin-bottom: 1.5rem;
    }

    .form-header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .form-header p {
      color: ${mutedText};
      font-size: 0.875rem;
    }

    /* Progress Bar */
    .progress-bar {
      height: 6px;
      background: ${borderColor};
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: ${primaryColor};
      transition: width 0.3s ease;
    }

    .step-indicator {
      font-size: 0.75rem;
      color: ${mutedText};
      margin-bottom: 1.5rem;
    }

    /* Step */
    .step h2 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .step-desc {
      color: ${mutedText};
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }

    /* Questions */
    .questions {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .question {
      display: flex;
      flex-direction: column;
    }

    .label {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.375rem;
    }

    .required {
      color: #ef4444;
      margin-left: 0.25rem;
    }

    .help-text {
      font-size: 0.75rem;
      color: ${mutedText};
      margin-bottom: 0.375rem;
    }

    /* Inputs */
    .input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      font-size: 0.875rem;
      border: 1px solid ${borderColor};
      border-radius: calc(${borderRadius} / 2);
      background: ${backgroundColor};
      color: ${textColor};
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .input:focus {
      outline: none;
      border-color: ${primaryColor};
      box-shadow: 0 0 0 3px ${primaryLight};
    }

    .input::placeholder {
      color: ${mutedText};
    }

    .textarea {
      min-height: 100px;
      resize: vertical;
    }

    .select {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }

    /* Radio & Checkbox Groups */
    .radio-group, .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .radio-label, .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .radio-label input, .checkbox-label input {
      width: 1rem;
      height: 1rem;
      cursor: pointer;
      accent-color: ${primaryColor};
    }

    /* Buttons */
    .form-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: space-between;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid ${borderColor};
    }

    .btn {
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: calc(${borderRadius} / 2);
      cursor: pointer;
      transition: all 0.15s;
      border: none;
    }

    .btn-primary {
      background: ${primaryColor};
      color: white;
      margin-left: auto;
    }

    .btn-primary:hover {
      background: ${primaryHover};
    }

    .btn-primary:focus {
      outline: none;
      box-shadow: 0 0 0 3px ${primaryLight};
    }

    .btn-secondary {
      background: transparent;
      color: ${textColor};
      border: 1px solid ${borderColor};
    }

    .btn-secondary:hover {
      background: ${borderColor};
    }

    /* Responsive */
    @media (max-width: 480px) {
      .form-container {
        padding: 1rem;
      }
      
      .form-header h1 {
        font-size: 1.25rem;
      }
    }
  `;
}

/**
 * Adjust color lightness
 * @param hex Hex color code
 * @param percent Positive = lighter, Negative = darker
 */
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}
