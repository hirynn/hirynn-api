import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Res,
  BadRequestException,
  Patch,
  Logger,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, UserType } from './dto/login.dto';
import { RegisterTeacherDto } from './dto/register-teacher.dto';
import { RegisterSchoolAdminDto } from './dto/register-school-admin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LinkedInAuthDto } from './dto/linkedin-auth-dto';

// Export the AuthResponse interface
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    userType: string;
    isVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface GoogleAuthResponse extends AuthResponse {
  isNewUser: boolean;
}

export interface LinkedInAuthResponse extends AuthResponse {
  isNewUser: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  isActive: boolean;
  isVerified: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Add type definitions for LinkedIn API responses
interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
  token_type: string;
}

export interface LinkedInUserProfile {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
  locale?: string;
}


@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            userType: { type: 'string' },
            isVerified: { type: 'boolean' },
          },
        },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);

      const authResponse = await this.authService.login(loginDto);

      // Set secure cookies
      this.setCookies(res, authResponse.tokens);

      this.logger.log(`Successful login for user: ${authResponse.user.id}`);
      return authResponse;
    } catch (error) {
      this.logger.error(
        `Login failed for email: ${loginDto.email}`,
        error.stack,
      );
      throw error;
    }
  }

  @Public()
  @Post('register/teacher')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @ApiOperation({ summary: 'Register as a teacher' })
  @ApiResponse({
    status: 201,
    description: 'Teacher registration successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            userType: { type: 'string', example: 'TEACHER' },
            isVerified: { type: 'boolean' },
          },
        },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email already exists or validation error',
  })
  @ApiResponse({ status: 429, description: 'Too many registration attempts' })
  async registerTeacher(
    @Body() registerTeacherDto: RegisterTeacherDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    try {
      this.logger.log(
        `Teacher registration attempt for email: ${registerTeacherDto.email}`,
      );

      const authResponse =
        await this.authService.registerTeacher(registerTeacherDto);

      // Set secure cookies
      this.setCookies(res, authResponse.tokens);

      this.logger.log(
        `Successful teacher registration for user: ${authResponse.user.id}`,
      );
      return authResponse;
    } catch (error) {
      this.logger.error(
        `Teacher registration failed for email: ${registerTeacherDto.email}`,
        error.stack,
      );
      throw error;
    }
  }

  @Public()
  @Post('register/school-admin')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @ApiOperation({ summary: 'Register as a school admin' })
  @ApiResponse({
    status: 201,
    description: 'School admin registration successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            userType: { type: 'string', example: 'SCHOOL_ADMIN' },
            isVerified: { type: 'boolean' },
          },
        },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email already exists or validation error',
  })
  @ApiResponse({ status: 429, description: 'Too many registration attempts' })
  async registerSchoolAdmin(
    @Body() registerSchoolAdminDto: RegisterSchoolAdminDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    try {
      this.logger.log(
        `School admin registration attempt for email: ${registerSchoolAdminDto.email}`,
      );

      const authResponse = await this.authService.registerSchoolAdmin(
        registerSchoolAdminDto,
      );

      // Set secure cookies
      this.setCookies(res, authResponse.tokens);

      this.logger.log(
        `Successful school admin registration for user: ${authResponse.user.id}`,
      );
      return authResponse;
    } catch (error) {
      this.logger.error(
        `School admin registration failed for email: ${registerSchoolAdminDto.email}`,
        error.stack,
      );
      throw error;
    }
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 attempts per 5 minutes
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description:
      'Password reset email sent (or email not found - same response for security)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'If an account with that email exists, a password reset link has been sent',
        },
      },
    },
  })
  @ApiResponse({ status: 429, description: 'Too many password reset attempts' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    try {
      this.logger.log(
        `Password reset requested for email: ${forgotPasswordDto.email}`,
      );

      await this.authService.forgotPassword(forgotPasswordDto.email);

      // Always return the same message for security (don't reveal if email exists)
      return {
        message:
          'If an account with that email exists, a password reset link has been sent',
      };
    } catch (error) {
      this.logger.error(
        `Password reset failed for email: ${forgotPasswordDto.email}`,
        error.stack,
      );
      // Still return success message for security
      return {
        message:
          'If an account with that email exists, a password reset link has been sent',
      };
    }
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 attempts per 5 minutes
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 429, description: 'Too many password reset attempts' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    try {
      const tokenRaw = req.query.token;

      if (!tokenRaw || typeof tokenRaw !== 'string') {
        throw new BadRequestException('Token not provided or invalid');
      }

      const token = tokenRaw;
      this.logger.log(
        `Password reset attempt with token: ${token.substring(0, 10)}...`,
      );

      const result = await this.authService.resetPassword(
        token,
        resetPasswordDto.password,
      );

      this.logger.log('Password reset successful');
      return result;
    } catch (error) {
      this.logger.error('Password reset failed', error.stack);
      throw error;
    }
  }

  @Public()
  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @ApiOperation({ summary: 'Google OAuth authentication' })
  @ApiResponse({
    status: 200,
    description: 'Google authentication successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            userType: { type: 'string' },
            isVerified: { type: 'boolean' },
          },
        },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        isNewUser: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Google token or user type',
  })
  @ApiResponse({ status: 429, description: 'Too many authentication attempts' })
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GoogleAuthResponse> {
    try {
      // Validate user type
      const validUserTypes = [UserType.TEACHER, UserType.SCHOOL_ADMIN];
      if (!validUserTypes.includes(googleAuthDto.userType as UserType)) {
        throw new BadRequestException(
          'Invalid user type. Must be TEACHER or SCHOOL_ADMIN',
        );
      }

      this.logger.log(
        `Google authentication attempt for user type: ${googleAuthDto.userType}`,
      );

      const authResponse = await this.authService.googleAuth(
        googleAuthDto.googleToken,
        googleAuthDto.userType as UserType.TEACHER | UserType.SCHOOL_ADMIN,
      );

      // Set secure cookies
      this.setCookies(res, authResponse.tokens);

      this.logger.log(
        `Successful Google authentication for user: ${authResponse.user.id}`,
      );
      return authResponse;
    } catch (error) {
      this.logger.error('Google authentication failed', error.stack);
      throw error;
    }
  }

  @Public()
  @Get('linkedin')
  @ApiOperation({ summary: 'Initiate LinkedIn OAuth flow' })
  @ApiQuery({
    name: 'userType',
    required: true,
    enum: ['TEACHER', 'SCHOOL_ADMIN'],
    description: 'User type for LinkedIn authentication',
  })
  @ApiResponse({ status: 302, description: 'Redirect to LinkedIn OAuth' })
  linkedinAuth(
    @Res() res: Response,
  ): void {
    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_CALLBACK_URL!)}&scope=openid%20profile%20email`;
    console.log(linkedinAuthUrl);

    res.redirect(linkedinAuthUrl);
  }

  @Public()
  @Get('linkedin/redirect')
  @ApiOperation({ summary: 'LinkedIn OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirect after LinkedIn OAuth' })
  async linkedinCallback(
    @Query('code') code: string,
  ): Promise<{ message: string; accessToken: string }> {
    try {
      if (!code) {
        throw new BadRequestException('Authorization code not provided');
      }

      // Exchange code for access token
      const tokenResponse = await fetch(
        'https://www.linkedin.com/oauth/v2/accessToken',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            redirect_uri: process.env.LINKEDIN_CALLBACK_URL!,
          }),
        },
      );

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for access token');
      }

      const tokenData = (await tokenResponse.json()) as LinkedInTokenResponse;
      const accessToken = tokenData.access_token;

      return { message: 'success', accessToken };
    } catch (error) {
      this.logger.error('LinkedIn authentication callback failed', error.stack);

      throw error;
    }
  }

  @Public()
  @Post('linkedin/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @ApiOperation({ summary: 'LinkedIn OAuth login using accessToken' })
  @ApiResponse({
    status: 200,
    description: 'LinkedIn authentication successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            userType: { type: 'string' },
            isVerified: { type: 'boolean' },
          },
        },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        isNewUser: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid LinkedIn token or user type',
  })
  @ApiResponse({ status: 429, description: 'Too many authentication attempts' })
  async linkedinLogin(
    @Body() linkedInAuthDto: LinkedInAuthDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LinkedInAuthResponse> {
    //Get user profile
    
    // Authenticate with your auth service
    const authResponse = await this.authService.linkedinAuth(
      linkedInAuthDto.linkedInToken,
      linkedInAuthDto.userType as UserType.TEACHER | UserType.SCHOOL_ADMIN,
    );
    // Set secure cookies
    this.setCookies(res, authResponse.tokens);
    this.logger.log(
      `LinkedIn authentication successful for user: ${authResponse.user.id}`,
    );
    return authResponse;
  }

  @Patch('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 attempts per 5 minutes
  @ApiOperation({ summary: 'Change the account password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 429,
    description: 'Too many password change attempts',
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any,
  ): Promise<{ message: string }> {
    try {
      const user = req.user as UserProfile;
      this.logger.log(`Password change attempt for user: ${user.id}`);

      const result = await this.authService.changePassword(
        changePasswordDto,
        user,
      );

      this.logger.log(`Password changed successfully for user: ${user.id}`);
      return result;
    } catch (error) {
      const user = req.user as UserProfile;
      this.logger.error(
        `Password change failed for user: ${user.id}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string' },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Refresh token is required' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 429, description: 'Too many refresh attempts' })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    try {
      if (!refreshToken) {
        throw new BadRequestException('Refresh token is required');
      }

      this.logger.log('Token refresh attempt');

      const accessToken = await this.authService.refreshToken(refreshToken);
      const isProduction = process.env.NODE_ENV === 'production';
      // Update cookies with new tokens
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        maxAge: 15 * 60 * 1000, // 15 minutes
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/',
      });

      this.logger.log('Token refresh successful');
      return accessToken;
    } catch (error) {
      this.logger.error('Token refresh failed', error.stack);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string' },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout successful' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Refresh token is required' })
  logout(
    @Body('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): { message: string } {
    try {
      if (!refreshToken) {
        throw new BadRequestException('Refresh token is required');
      }

      this.logger.log('Logout attempt');

      const result = this.authService.logout(refreshToken);

      // Clear cookies
      this.clearCookies(res);

      this.logger.log('Logout successful');
      return result;
    } catch (error) {
      this.logger.error('Logout failed', error.stack);
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
        userType: { type: 'string' },
        isActive: { type: 'boolean' },
        isVerified: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req: Request): UserProfile {
    const user = req.user as UserProfile;
    this.logger.log(`Profile accessed for user: ${user.id}`);
    return user;
  }

  // Helper method to set secure cookies
  private setCookies(res: Response, tokens: TokenResponse): void {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    });
  }

  // Helper method to clear cookies
  private clearCookies(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    });
  }
}
