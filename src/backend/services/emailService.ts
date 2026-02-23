import { logger } from '../utils/logger';
import { AppError } from '../../shared/errors';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  fromEmail?: string;
  fromName?: string;
}

export interface EmailServiceResult {
  success: boolean;
  error?: string;
}

/**
 * Email service for sending feedback emails
 * Uses EmailJS for client-side email sending (no backend required)
 */
export class EmailService {
  private static readonly EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || '';
  private static readonly EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || '';
  private static readonly EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '';
  private static readonly EMAIL_API_ENDPOINT = process.env.EXPO_PUBLIC_EMAIL_API_ENDPOINT || '';
  private static readonly FORMSPREE_ENDPOINT = process.env.EXPO_PUBLIC_FORMSPREE_ENDPOINT || '';
  private static readonly FALLBACK_EMAIL = 'gameapptop10@gmail.com';

  // Debug: Log configuration on first access
  private static configLogged = false;
  private static logConfig() {
    if (!this.configLogged) {
      logger.log('📧 EmailService Configuration:', {
        hasServiceId: !!this.EMAILJS_SERVICE_ID,
        hasTemplateId: !!this.EMAILJS_TEMPLATE_ID,
        hasPublicKey: !!this.EMAILJS_PUBLIC_KEY,
        hasApiEndpoint: !!this.EMAIL_API_ENDPOINT,
        hasFormspreeEndpoint: !!this.FORMSPREE_ENDPOINT,
        serviceId: this.EMAILJS_SERVICE_ID ? `${this.EMAILJS_SERVICE_ID.substring(0, 10)}...` : 'not set',
        templateId: this.EMAILJS_TEMPLATE_ID ? `${this.EMAILJS_TEMPLATE_ID.substring(0, 10)}...` : 'not set',
      });
      this.configLogged = true;
    }
  }

  /**
   * Send feedback email using EmailJS
   */
  static async sendFeedbackEmail(params: SendEmailParams): Promise<EmailServiceResult> {
    try {
      // Log configuration for debugging
      this.logConfig();

      const { to, subject, body, fromEmail, fromName } = params;

      // Validate required fields
      if (!body || !body.trim()) {
        return {
          success: false,
          error: 'Feedback message cannot be empty'
        };
      }

      // Try HTTP API endpoint first (if configured)
      if (this.EMAIL_API_ENDPOINT) {
        const apiResult = await this.sendViaAPI({
          to,
          subject,
          body,
          fromEmail,
          fromName
        });
        if (apiResult.success) {
          return apiResult;
        }
        // If API fails, continue to other methods
        logger.log('API endpoint failed, trying other methods');
      }

      // Try EmailJS if configured
      if (this.EMAILJS_SERVICE_ID && this.EMAILJS_TEMPLATE_ID && this.EMAILJS_PUBLIC_KEY) {
        logger.log('📧 Attempting to send via EmailJS...');
        const emailjsResult = await this.sendViaEmailJS({
          to,
          subject,
          body,
          fromEmail,
          fromName
        });
        if (emailjsResult.success && emailjsResult.error !== 'MAILTO_FALLBACK') {
          logger.log('✅ Email sent successfully via EmailJS');
          return emailjsResult;
        } else {
          logger.warn('⚠️ EmailJS send failed:', emailjsResult.error);
        }
      } else {
        logger.warn('⚠️ EmailJS not fully configured:', {
          hasServiceId: !!this.EMAILJS_SERVICE_ID,
          hasTemplateId: !!this.EMAILJS_TEMPLATE_ID,
          hasPublicKey: !!this.EMAILJS_PUBLIC_KEY
        });
      }

      // Use Formspree if configured
      if (this.FORMSPREE_ENDPOINT) {
        const formspreeResult = await this.sendViaFormspree({
          to,
          subject,
          body,
          fromEmail,
          fromName
        });
        if (formspreeResult.success) {
          return formspreeResult;
        }
      }

      // If all methods fail, show helpful error
      logger.error('No email service configured. Please set up EmailJS, Formspree, or API endpoint.');
      return {
        success: false,
        error: 'Email service not configured. Please set up an email service in the .env file. See FEEDBACK_EMAIL_SETUP.md for instructions.'
      };
    } catch (error) {
      logger.error('Error sending feedback email:', error);
      const appError = error instanceof AppError ? error : new AppError({
        code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send email',
        userMessage: 'Failed to send feedback. Please try again later.'
      });
      
      return {
        success: false,
        error: appError.userMessage ?? appError.message
      };
    }
  }

  /**
   * Send email via HTTP API endpoint
   */
  private static async sendViaAPI(params: SendEmailParams): Promise<EmailServiceResult> {
    try {
      const response = await fetch(this.EMAIL_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: params.to,
          subject: params.subject,
          body: params.body,
          fromEmail: params.fromEmail,
          fromName: params.fromName
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      logger.log('Email sent successfully via API:', result);
      
      return {
        success: true
      };
    } catch (error: any) {
      logger.error('API send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send via API'
      };
    }
  }

  /**
   * Send email via EmailJS
   */
  private static async sendViaEmailJS(params: SendEmailParams): Promise<EmailServiceResult> {
    try {
      // Dynamically import EmailJS to avoid issues if not installed
      let emailjs: any;
      try {
        emailjs = await import('@emailjs/browser');
      } catch (importError) {
        logger.warn('EmailJS not installed, cannot use EmailJS');
        return {
          success: false,
          error: 'MAILTO_FALLBACK'
        };
      }
      
      if (!emailjs || !emailjs.send) {
        logger.warn('EmailJS not available, falling back to mailto');
        return {
          success: false,
          error: 'MAILTO_FALLBACK'
        };
      }

      // Initialize EmailJS if not already initialized
      if (this.EMAILJS_PUBLIC_KEY && emailjs.init) {
        emailjs.init(this.EMAILJS_PUBLIC_KEY);
      }

      const templateParams = {
        to_email: params.to,
        from_email: params.fromEmail || 'noreply@top10game.com',
        from_name: params.fromName || 'Top 10 Game User',
        subject: params.subject,
        message: params.body,
        reply_to: params.fromEmail || ''
      };

      const response = await emailjs.send(
        this.EMAILJS_SERVICE_ID,
        this.EMAILJS_TEMPLATE_ID,
        templateParams
      );

      logger.log('Email sent successfully via EmailJS:', response);
      
      return {
        success: true
      };
    } catch (error: any) {
      logger.error('EmailJS send error:', error);
      
      // Return error to allow fallback
      return {
        success: false,
        error: 'MAILTO_FALLBACK'
      };
    }
  }

  /**
   * Send email via Formspree (free service, works immediately)
   */
  private static async sendViaFormspree(params: SendEmailParams): Promise<EmailServiceResult> {
    try {
      // Formspree expects form-encoded data or JSON
      const formData = new URLSearchParams();
      formData.append('email', params.fromEmail || 'noreply@top10game.com');
      formData.append('subject', params.subject);
      formData.append('message', params.body);
      formData.append('_to', params.to);
      formData.append('_replyto', params.fromEmail || '');
      formData.append('_format', 'plain');

      const response = await fetch(this.FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Formspree error response:', errorText);
        throw new Error(`Formspree returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.log('Email sent successfully via Formspree:', result);
      
      return {
        success: true
      };
    } catch (error: any) {
      logger.error('Formspree send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send via Formspree'
      };
    }
  }

  /**
   * Check if EmailJS is configured
   */
  static isEmailJSConfigured(): boolean {
    return !!(
      this.EMAILJS_SERVICE_ID &&
      this.EMAILJS_TEMPLATE_ID &&
      this.EMAILJS_PUBLIC_KEY
    );
  }
}
