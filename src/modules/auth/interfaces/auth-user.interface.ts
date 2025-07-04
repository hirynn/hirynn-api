import { AdminRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  userType: 'TEACHER' | 'SCHOOL_ADMIN' | 'ADMIN';
  isActive: boolean;
  isVerified: boolean;
  permissions?: string[];
  role?: AdminRole;
}
