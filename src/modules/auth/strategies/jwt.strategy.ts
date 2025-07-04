import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../database/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthUser } from '../interfaces/auth-user.interface';
import { AdminRole } from '@prisma/client';

type UserData = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  isVerified?: boolean;
  role?: AdminRole;
  permissions?: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('jwt.accessToken.secret');
    if (!jwtSecret) {
      throw new Error('JWT secret is missing in configuration');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Then try to extract from cookies
        (req: Request) => JwtStrategy.extractJWTFromCookie(req),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  // Custom extractor to get JWT from cookies
  private static extractJWTFromCookie(req: Request): string | null {
    if (
      req.cookies &&
      'accessToken' in req.cookies &&
      req.cookies.accessToken.length > 0
    ) {
      return req.cookies.accessToken as string;
    }
    return null;
  }

  async validate(payload: unknown): Promise<AuthUser> {
    // Type guard to ensure payload is properly typed
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('sub' in payload) ||
      !('userType' in payload)
    ) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const typedPayload = payload as JwtPayload;
    const sub = String(typedPayload.sub);
    const userType = typedPayload.userType;

    try {
      let user: UserData | null = null;

      switch (userType) {
        case 'TEACHER':
          user = await this.prisma.teacher.findUnique({
            where: { id: sub },
            select: {
              id: true,
              email: true,
              name: true,
              isActive: true,
              isVerified: true,
            },
          });
          break;
        case 'SCHOOL_ADMIN':
          user = await this.prisma.schoolAdmin.findUnique({
            where: { id: sub },
            select: {
              id: true,
              email: true,
              name: true,
              isActive: true,
              isVerified: true,
            },
          });
          break;
        case 'ADMIN':
          user = await this.prisma.admin.findUnique({
            where: { id: sub },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              permissions: true,
              isActive: true,
            },
          });
          break;
        default:
          throw new UnauthorizedException('Invalid user type');
      }

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        userType,
        isActive: user.isActive,
        isVerified: user.isVerified ?? true,
        role: user.role,
        permissions: user.permissions,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
