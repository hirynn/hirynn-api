import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

// Gates server-to-server calls from the Betterschool Directory backend
// (which has no Hirynn user session to attach a JWT for). Directory sends
// the shared secret as a plain bearer token — a custom header like
// `x-service-secret` gets stripped by Cloudflare in production, so we reuse
// the standard `Authorization: Bearer <secret>` header instead. This never
// collides with the JWT auth guard since these routes don't use it.
@Injectable()
export class ServiceSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers['authorization'];
    const secret = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;
    const expected = process.env.DIRECTORY_INTEGRATION_SECRET;

    if (!expected || !secret || secret !== expected) {
      throw new UnauthorizedException('Invalid service credentials');
    }
    return true;
  }
}
