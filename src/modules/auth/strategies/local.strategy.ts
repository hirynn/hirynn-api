import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<AuthUser> {
    try {
      // Use the correct login method from AuthService
      const result = await this.authService.login({
        email,
        password,
        userType: undefined, // Let the service determine the user type
      });

      if (!result) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Convert the AuthResponse to AuthUser format for Passport
      const authUser: AuthUser = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        userType: result.user.userType,
        isVerified: result.user.isVerified,
        isActive: result.user.isActive,
      };

      return authUser;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
