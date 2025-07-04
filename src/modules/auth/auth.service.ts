import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, UserType } from './dto/login.dto';
import { RegisterTeacherDto } from './dto/register-teacher.dto';
import { RegisterSchoolAdminDto } from './dto/register-school-admin.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LinkedInUserProfile, UserProfile } from './auth.controller';
import { EmailService, ForgotPasswordEmailData } from '../email/email.service';

// Define proper types for database entities
interface BaseUser {
  id: string;
  email: string;
  name: string;
  password?: string;
  googleId?: string;
  linkedinId?: string;
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  resetToken?: string;
}

interface Teacher extends BaseUser {
  phone?: string;
  location?: string;
  bio?: string;
  subjectsTaught: string[];
  gradeLevels: string[];
  yearsExperience: number;
  currentSchool?: string;
  profilePhotoUrl?: string;
}

interface SchoolAdmin extends BaseUser {
  phone?: string;
}

// Fixed: Admin interface now has proper members
interface Admin extends BaseUser {
  role?: string;
  permissions?: string[];
}

type UserEntity = Teacher | SchoolAdmin | Admin;

// Export AuthResponse interface
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    userType: UserType;
    isVerified: boolean;
    isActive: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

interface LinkedInUser {
  linkedinId: string;
  name: string;
  email: string;
  photo?: string;
  emailVerified?: boolean;
  locale?: string;
}

@Injectable()
export class AuthService {
  private refreshTokens = new Set<string>(); // In production, use Redis or database

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly emailService: EmailService,
  ) {}

  // Sign In
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password, userType } = loginDto;

    let user: UserEntity | null = null;
    let foundUserType: UserType | null = null;

    try {
      // If userType is specified, only check that user type
      if (userType) {
        user = await this.findUserByTypeAndEmail(userType, email);
        foundUserType = userType;
      } else {
        // Try to find user in all user types
        const types: UserType[] = [
          UserType.TEACHER,
          UserType.SCHOOL_ADMIN,
          UserType.ADMIN,
        ];

        for (const type of types) {
          user = await this.findUserByTypeAndEmail(type, email);
          if (user) {
            foundUserType = type;
            break;
          }
        }
      }

      if (!foundUserType) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Verify password
      if (!user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate tokens
      const tokens = await this.generateTokens(
        user.id,
        user.email,
        foundUserType,
      );

      // save the refresh token to the user db
      await this.saveRefreshToken(user.id, tokens.refreshToken, foundUserType);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: foundUserType,
          isVerified: user.isVerified ?? true,
          isActive: user.isActive,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Login error:', error);
      throw new InternalServerErrorException('Login failed');
    }
  }

  // Register Teacher
  async registerTeacher(
    registerDto: RegisterTeacherDto,
  ): Promise<AuthResponse> {
    const { email, password, name, ...otherFields } = registerDto;

    // Check if email already exists
    await this.checkEmailExists(email);

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create teacher
      const teacher = (await this.prisma.teacher.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone: otherFields.phone,
          location: otherFields.location,
          bio: otherFields.bio,
          subjectsTaught: otherFields.subjectsTaught || [],
          gradeLevels: otherFields.gradeLevels || [],
          yearsExperience: otherFields.yearsExperience || 0,
          currentSchool: otherFields.currentSchool,
          isActive: true,
          isVerified: false,
        },
      })) as Teacher;

      // Generate tokens
      const tokens = await this.generateTokens(
        teacher.id,
        teacher.email,
        UserType.TEACHER,
      );

      return {
        user: {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
          userType: UserType.TEACHER,
          isVerified: teacher.isVerified,
          isActive: teacher.isActive,
        },
        tokens,
      };
    } catch (error) {
      console.error('Teacher registration error:', error);
      throw new InternalServerErrorException('Teacher registration failed');
    }
  }

  // Register School Admin
  async registerSchoolAdmin(
    registerDto: RegisterSchoolAdminDto,
  ): Promise<AuthResponse> {
    const { email, password, name, phone } = registerDto;

    // Check if email already exists
    await this.checkEmailExists(email);

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create school admin
      const schoolAdmin = (await this.prisma.schoolAdmin.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          isActive: true,
          isVerified: false,
        },
      })) as SchoolAdmin;

      // Generate tokens
      const tokens = await this.generateTokens(
        schoolAdmin.id,
        schoolAdmin.email,
        UserType.SCHOOL_ADMIN,
      );

      return {
        user: {
          id: schoolAdmin.id,
          email: schoolAdmin.email,
          name: schoolAdmin.name,
          userType: UserType.SCHOOL_ADMIN,
          isVerified: schoolAdmin.isVerified,
          isActive: schoolAdmin.isActive,
        },
        tokens,
      };
    } catch (error) {
      console.error('School admin registration error:', error);
      throw new InternalServerErrorException(
        'School admin registration failed',
      );
    }
  }

  // Forgot Password
  async forgotPassword(email: string): Promise<{ message: string }> {
    // Find user across all user types
    const types: UserType[] = [
      UserType.TEACHER,
      UserType.SCHOOL_ADMIN,
      UserType.ADMIN,
    ];
    let user: UserEntity | null = null;
    let foundUserType: UserType | null = null;

    for (const type of types) {
      user = await this.findUserByTypeAndEmail(type, email);
      if (user) {
        foundUserType = type;
        break;
      }
    }

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }
    if (!foundUserType) {
      throw new NotFoundException('User with this email does not exist');
    }

    try {
      const resetToken = await this.jwtService.signAsync(
        { email },
        {
          secret: this.configService.get<string>('jwt.resetToken.secret'),
          expiresIn: this.configService.get<string>(
            'jwt.resetToken.expiresIn',
            '15m',
          ),
        },
      );

      // send the password reset email
      await this.emailService.sendForgotPasswordEmail(email, {
        name: user.name,
        resetToken,
        resetUrl: `http://localhost:8000/api/auth/reset-password?token=${resetToken}`,
        expiresIn: this.configService.get<string>(
          'jwt.resetToken.expiresIn',
          '15m',
        ),
      } as ForgotPasswordEmailData);

      // Store reset token (in production, use Redis or database)
      await this.saveResetToken(user.id, resetToken, foundUserType);

      return { message: 'Password reset email sent successfully' };
    } catch (error) {
      console.error('Forgot password error:', error);
      throw new InternalServerErrorException(
        'Failed to send password reset email',
      );
    }
  }

  // Reset Password
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      // Verify token
      const payload: JwtPayload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.resetToken.secret'),
      });

      const email = payload.email;
      if (!email) {
        throw new BadRequestException(
          'Invalid token: Email not found in token',
        );
      }

      // Find user
      const userTypes: UserType[] = [
        UserType.TEACHER,
        UserType.SCHOOL_ADMIN,
        UserType.ADMIN,
      ];

      let user: UserEntity | null = null;
      let foundType: UserType | null = null;

      for (const type of userTypes) {
        const u = await this.findUserByTypeAndEmail(type, email);
        if (u) {
          user = u;
          foundType = type;
          break;
        }
      }

      if (!user || !foundType) {
        throw new NotFoundException('User not found for password reset');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password based on user type
      switch (foundType) {
        case UserType.TEACHER:
          await this.prisma.teacher.update({
            where: { id: user.id },
            data: { password: hashedPassword },
          });
          break;
        case UserType.SCHOOL_ADMIN:
          await this.prisma.schoolAdmin.update({
            where: { id: user.id },
            data: { password: hashedPassword },
          });
          break;
        case UserType.ADMIN:
          await this.prisma.admin.update({
            where: { id: user.id },
            data: { password: hashedPassword },
          });
          break;
        default:
          throw new BadRequestException('Invalid user type');
      }

      return { message: 'Password reset successfully' };
    } catch (error) {
      console.error('Reset password error:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  // Google Authentication
  async googleAuth(
    googleToken: string,
    userType: UserType.TEACHER | UserType.SCHOOL_ADMIN,
  ): Promise<AuthResponse & { isNewUser: boolean }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`,
        ),
      );

      const payload = response.data as GoogleUserInfo;
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const googleUser: GoogleUserInfo = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified,
      };

      // Check if user exists
      let user = await this.findUserByTypeAndEmail(userType, googleUser.email);
      let isNewUser = false;

      if (!user) {
        // Create new user
        isNewUser = true;
        if (userType === UserType.TEACHER) {
          user = (await this.prisma.teacher.create({
            data: {
              email: googleUser.email,
              googleId: googleUser.id,
              name: googleUser.name,
              profilePhotoUrl: googleUser.picture,
              isVerified: true,
              isActive: true,
              subjectsTaught: [],
              gradeLevels: [],
              yearsExperience: 0,
            },
          })) as Teacher;
        } else {
          user = (await this.prisma.schoolAdmin.create({
            data: {
              email: googleUser.email,
              googleId: googleUser.id,
              name: googleUser.name,
              isVerified: true,
              isActive: true,
            },
          })) as SchoolAdmin;
        }
      } else if (!user.googleId) {
        // Link existing account with Google
        if (userType === UserType.TEACHER) {
          user = (await this.prisma.teacher.update({
            where: { id: user.id },
            data: { googleId: googleUser.id },
          })) as Teacher;
        } else {
          user = (await this.prisma.schoolAdmin.update({
            where: { id: user.id },
            data: { googleId: googleUser.id },
          })) as SchoolAdmin;
        }
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, userType);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType,
          isVerified: user.isVerified,
          isActive: user.isActive,
        },
        tokens,
        isNewUser,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Google auth error:', error);
      throw new BadRequestException('Google authentication failed');
    }
  }

  // LinkedIn Authentication
  async linkedinAuth(
    linkedInToken: string,
    userType: UserType.TEACHER | UserType.SCHOOL_ADMIN,
  ): Promise<AuthResponse & { isNewUser: boolean }> {
    try {
      const profileResponse = await fetch(
        'https://api.linkedin.com/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${linkedInToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const profile = (await profileResponse.json()) as LinkedInUserProfile;
      // Create LinkedIn user object
      const linkedinUser: LinkedInUser = {
        linkedinId: profile.sub,
        name: profile.name,
        email: profile.email,
        photo: profile.picture,
        emailVerified: profile.email_verified,
        locale: profile.locale,
      };
      let user = await this.findUserByTypeAndEmail(
        userType,
        linkedinUser.email,
      );
      let isNewUser = false;

      if (!user) {
        // Create new user
        isNewUser = true;
        if (userType === UserType.TEACHER) {
          user = (await this.prisma.teacher.create({
            data: {
              email: linkedinUser.email,
              linkedinId: linkedinUser.linkedinId,
              name: linkedinUser.name,
              profilePhotoUrl: linkedinUser.photo,
              isVerified: linkedinUser.emailVerified ?? true,
              isActive: true,
              subjectsTaught: [],
              gradeLevels: [],
              yearsExperience: 0,
            },
          })) as Teacher;
        } else {
          user = (await this.prisma.schoolAdmin.create({
            data: {
              email: linkedinUser.email,
              linkedinId: linkedinUser.linkedinId,
              name: linkedinUser.name,
              isVerified: linkedinUser.emailVerified ?? true,
              isActive: true,
            },
          })) as SchoolAdmin;
        }
      } else if (!user.linkedinId) {
        // Link existing account with LinkedIn
        if (userType === UserType.TEACHER) {
          user = (await this.prisma.teacher.update({
            where: { id: user.id },
            data: {
              linkedinId: linkedinUser.linkedinId,
              profilePhotoUrl: linkedinUser.photo,
            },
          })) as Teacher;
        } else {
          user = (await this.prisma.schoolAdmin.update({
            where: { id: user.id },
            data: {
              linkedinId: linkedinUser.linkedinId,
            },
          })) as SchoolAdmin;
        }
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, userType);

      // Save refresh token
      await this.saveRefreshToken(user.id, tokens.refreshToken, userType);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType,
          isVerified: user.isVerified,
          isActive: user.isActive,
        },
        tokens,
        isNewUser,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('LinkedIn auth error:', error);
      throw new BadRequestException('LinkedIn authentication failed');
    }
  }

  // Change Password
  async changePassword(
    changePasswordDto: ChangePasswordDto,
    user: UserProfile,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    try {
      // Get the current user with password from database
      const currentUser = await this.findUserByTypeAndEmail(
        user.userType,
        user.email,
      );

      if (!currentUser) {
        throw new NotFoundException('User not found');
      }

      // Check if user has a password (might be Google/LinkedIn user)
      if (!currentUser.password) {
        throw new BadRequestException(
          'Cannot change password for social login accounts',
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        currentUser.password,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(
        newPassword,
        currentUser.password,
      );
      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from current password',
        );
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password in database based on user type
      switch (user.userType) {
        case UserType.TEACHER:
          await this.prisma.teacher.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
          });
          break;
        case UserType.SCHOOL_ADMIN:
          await this.prisma.schoolAdmin.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
          });
          break;
        case UserType.ADMIN:
          await this.prisma.admin.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
          });
          break;
        default:
          throw new BadRequestException('Invalid user type');
      }

      // Optional: Invalidate all refresh tokens for this user (force re-login on all devices)
      // This is a security best practice when password is changed
      const userRefreshTokens = Array.from(this.refreshTokens).filter(
        (token) => {
          try {
            const secret = this.configService.get<string>(
              'jwt.refreshToken.secret',
            );
            if (!secret) {
              throw new UnauthorizedException('Invalid refresh token');
            }

            const payload: JwtPayload = this.jwtService.verify(token, {
              secret,
            });
            return payload.sub === user.id;
          } catch {
            return false;
          }
        },
      );

      userRefreshTokens.forEach((token) => this.refreshTokens.delete(token));

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Change password error:', error);
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  // Refresh Token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      if (!this.refreshTokens.has(refreshToken)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const secret = this.configService.get<string>('jwt.refreshToken.secret');
      if (!secret) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify refresh token
      const payload: JwtPayload = await this.jwtService.verify(refreshToken, {
        secret,
      });
      if (!payload) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.findUserByTypeAndEmail(
        payload.userType as UserType,
        payload.email,
      );

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!tokenMatch) {
        await this.deleteToken(
          user?.id,
          payload.userType as UserType,
          'refreshToken',
        );
        throw new UnauthorizedException('Invalid refresh token| Login Again');
      }
      // Generate new tokens
      const accessToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, userType: payload.userType },
        {
          secret: this.configService.get<string>('jwt.accessToken.secret'),
          expiresIn: this.configService.get<string>(
            'jwt.accessToken.expiresIn',
            '15m',
          ),
        },
      );

      return { accessToken };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Logout
  logout(refreshToken: string): { message: string } {
    this.refreshTokens.delete(refreshToken);
    return { message: 'Logout successful' };
  }

  // Helper Methods
  private async findUserByTypeAndEmail(
    userType: UserType,
    email: string,
  ): Promise<UserEntity | null> {
    switch (userType) {
      case UserType.TEACHER:
        return this.prisma.teacher.findUnique({
          where: { email },
        }) as Promise<Teacher | null>;
      case UserType.SCHOOL_ADMIN:
        return this.prisma.schoolAdmin.findUnique({
          where: { email },
        }) as Promise<SchoolAdmin | null>;
      case UserType.ADMIN:
        return this.prisma.admin.findUnique({
          where: { email },
        }) as Promise<Admin | null>;
      default:
        return null;
    }
  }

  private async checkEmailExists(email: string): Promise<void> {
    const types: UserType[] = [
      UserType.TEACHER,
      UserType.SCHOOL_ADMIN,
      UserType.ADMIN,
    ];

    for (const type of types) {
      const existingUser = await this.findUserByTypeAndEmail(type, email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    userType: UserType,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      userType,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessToken.secret'),
        expiresIn: this.configService.get<string>(
          'jwt.accessToken.expiresIn',
          '15m',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshToken.secret'),
        expiresIn: this.configService.get<string>(
          'jwt.refreshToken.expiresIn',
          '7d',
        ),
      }),
    ]);

    // Store refresh token (in production, use Redis or database)
    this.refreshTokens.add(refreshToken);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
    userType: UserType,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    switch (userType) {
      case UserType.TEACHER:
        await this.prisma.teacher.update({
          where: { id: userId },
          data: { refreshToken: hashedRefreshToken },
        });
        break;
      case UserType.SCHOOL_ADMIN:
        await this.prisma.schoolAdmin.update({
          where: { id: userId },
          data: { refreshToken: hashedRefreshToken },
        });
        break;
      case UserType.ADMIN:
        await this.prisma.admin.update({
          where: { id: userId },
          data: { refreshToken: hashedRefreshToken },
        });
        break;
      default:
        throw new BadRequestException({
          message: 'Invalid user type',
        });
    }
  }

  private async saveResetToken(
    userId: string,
    resetToken: string,
    userType: UserType,
  ): Promise<void> {
    const hashedResetToken = await bcrypt.hash(resetToken, 12);
    switch (userType) {
      case UserType.TEACHER:
        await this.prisma.teacher.update({
          where: { id: userId },
          data: { resetToken: hashedResetToken },
        });
        break;
      case UserType.SCHOOL_ADMIN:
        await this.prisma.schoolAdmin.update({
          where: { id: userId },
          data: { resetToken: hashedResetToken },
        });
        break;
      case UserType.ADMIN:
        await this.prisma.admin.update({
          where: { id: userId },
          data: { resetToken: hashedResetToken },
        });
        break;
      default:
        throw new BadRequestException({
          message: 'Invalid user type',
        });
    }
  }

  private async deleteToken(
    userId: string,
    userType: UserType,
    tokenType: 'refreshToken' | 'resetToken',
  ): Promise<void> {
    switch (userType) {
      case UserType.TEACHER:
        await this.prisma.teacher.update({
          where: { id: userId },
          data: { [tokenType]: null },
        });
        break;
      case UserType.SCHOOL_ADMIN:
        await this.prisma.schoolAdmin.update({
          where: { id: userId },
          data: { [tokenType]: null },
        });
        break;
      case UserType.ADMIN:
        await this.prisma.admin.update({
          where: { id: userId },
          data: { [tokenType]: null },
        });
        break;
      default:
        throw new BadRequestException({
          message: 'Invalid user type',
        });
    }
  }
}
