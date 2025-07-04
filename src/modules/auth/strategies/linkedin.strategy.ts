import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy, VerifyCallback } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';

interface LinkedInProfile {
  sub: string;
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
  locale: string;
}

@Injectable()
export class LinkedInStrategy extends PassportStrategy(
  OAuth2Strategy,
  'linkedin',
) {
  constructor(private configService: ConfigService) {
    super({
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: configService.get<string>('linkedin.clientId')!,
      clientSecret: configService.get<string>('linkedin.clientSecret')!,
      callbackURL: configService.get<string>('linkedin.callbackURL')!,
      scope: 'openid profile email',
    });
  }

  userProfile(accessToken: string, done: VerifyCallback): void {
    fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch user profile: ${response.status}`);
        }
        return response.json() as Promise<LinkedInProfile>;
      })
      .then((profile: LinkedInProfile) => {
        done(null, profile);
      })
      .catch((error) => {
        done(error);
      });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: LinkedInProfile,
    done: VerifyCallback,
  ): void {
    try {
      const user = {
        linkedinId: profile.sub,
        name: profile.name,
        email: profile.email,
        photo: profile.picture,
        emailVerified: profile.email_verified,
        locale: profile.locale,
        accessToken,
        refreshToken,
      };

      done(null, user);
    } catch (error) {
      done(error);
    }
  }
}
