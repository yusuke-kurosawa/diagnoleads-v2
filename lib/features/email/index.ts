/**
 * Email Module
 *
 * Exports email service and templates
 */

export { isEmailConfigured, sendEmail } from './email-service';
export type { SendEmailOptions } from './email-service';

export { generateDiagnosticResultEmail } from './templates/diagnostic-result';
export type { DiagnosticResultEmailData } from './templates/diagnostic-result';
