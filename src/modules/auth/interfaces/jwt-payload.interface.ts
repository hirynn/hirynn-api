export interface JwtPayload {
  sub: string; // user id
  email: string;
  userType: 'TEACHER' | 'SCHOOL_ADMIN' | 'ADMIN';
  iat?: number;
  exp?: number;
}
