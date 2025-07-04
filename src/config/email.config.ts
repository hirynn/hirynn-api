// src/config/email.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT as string, 10) || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // For Gmail, use App Password
  },
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Hirynn Platform',
    email: process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER,
  },
}));
