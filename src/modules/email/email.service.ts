// src/modules/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { SendEmailDto } from './dto/send-email.dto';

export interface ForgotPasswordEmailData {
  name: string;
  email: string;
  resetToken: string;
  resetUrl: string;
  expiresIn: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
  userType: string;
  loginUrl: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    const emailConfig = {
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<boolean>('email.secure'),
      auth: {
        user: this.configService.get<string>('email.auth.user'),
        pass: this.configService.get<string>('email.auth.pass'),
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Email transporter configuration error:', error);
      } else {
        this.logger.log('Email server is ready to take our messages');
      }
    });
  }
  
  async sendForgotPasswordEmail(
    to: string,
    data: ForgotPasswordEmailData,
  ): Promise<void> {
    try {
      const template = await this.loadTemplate('password-reset.hbs');
      const html = template(data);

      const mailOptions = {
        from: {
          name: this.configService.get<string>('email.from.name')?? '',
          address: this.configService.get<string>('email.from.email')?? '',
        },
        to,
        subject: 'Reset Your Password - Hirynn',
        html,
        text: this.generatePlainTextForgotPassword(data),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}:`, error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<void> {
    try {
      const templateName =
        data.userType === 'teacher'
          ? 'welcome-teacher.hbs'
          : 'welcome-school-admin.hbs';

      const template = await this.loadTemplate(templateName);
      const html = template(data);

      const mailOptions = {
        from: {
          name: this.configService.get<string>('email.from.name') ?? 'hirynn',
          address: this.configService.get<string>('email.from.email') ?? 'noreply@hirynn.com',
        },
        to,
        subject: `Welcome to Hirynn - ${data.userType === 'teacher' ? 'Teacher' : 'School Admin'}`,
        html,
        text: this.generatePlainTextWelcome(data),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error);
      throw new Error('Failed to send welcome email');
    }
  }

  async sendJobApplicationEmail(
    to: string,
    data: {
      teacherName: string;
      jobTitle: string;
      schoolName: string;
      applicationUrl: string;
    },
  ): Promise<void> {
    try {
      const template = await this.loadTemplate('job-application.hbs');
      const html = template(data);

      const mailOptions = {
        from: {
          name: this.configService.get<string>('email.from.name') ?? 'hirynn',
          address: this.configService.get<string>('email.from.email') ?? 'noreply@hirynn.coom',
        },
        to,
        subject: `New Job Application - ${data.jobTitle}`,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Job application email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send job application email to ${to}:`,
        error,
      );
      throw new Error('Failed to send job application email');
    }
  }

  async sendVerificationEmail(
    to: string,
    data: {
      name: string;
      verificationUrl: string;
      userType: string;
    },
  ): Promise<void> {
    try {
      const template = await this.loadTemplate('verification.hbs');
      const html = template(data);

      const mailOptions = {
        from: {
          name: this.configService.get<string>('email.from.name') ?? 'hirynn',
          address: this.configService.get<string>('email.from.email') ?? 'noreply@hirynn.com',
        },
        to,
        subject: 'Verify Your Email - Hirynn',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}:`, error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<void> {
    try {
      const mailOptions = {
        from: {
          name: this.configService.get<string>('email.from.name') ?? 'hirynn',
          address: this.configService.get<string>('email.from.email') ?? 'noreply@hirynn.com',
        },
        to: sendEmailDto.to,
        subject: sendEmailDto.subject,
        html: sendEmailDto.html,
        text: sendEmailDto.text,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${sendEmailDto.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${sendEmailDto.to}:`, error);
      throw new Error('Failed to send email');
    }
  }

  private async loadTemplate(
    templateName: string,
  ): Promise<handlebars.TemplateDelegate> {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'modules',
        'email',
        'templates',
        templateName,
      );

      const templateSource = await fs.promises.readFile(templatePath, 'utf8');
      return handlebars.compile(templateSource);
    } catch (error) {
      this.logger.error(
        `Failed to load email template ${templateName}:`,
        error,
      );
      throw new Error(`Failed to load email template: ${templateName}`);
    }
  }

  private generatePlainTextForgotPassword(
    data: ForgotPasswordEmailData,
  ): string {
    return `
Hi ${data.name},

You requested to reset your password for your Hirynn account.

Click the link below to reset your password:
${data.resetUrl}

This link will expire in ${data.expiresIn}.

If you didn't request this password reset, please ignore this email.

Best regards,
The Hirynn Team
    `.trim();
  }

  private generatePlainTextWelcome(data: WelcomeEmailData): string {
    return `
Hi ${data.name},

Welcome to Hirynn! We're excited to have you join our community of educators.

Your account has been created successfully. You can now log in to start exploring opportunities.

Login here: ${data.loginUrl}

If you have any questions, feel free to reach out to our support team.

Best regards,
The Hirynn Team
    `.trim();
  }
}
