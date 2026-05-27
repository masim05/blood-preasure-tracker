export type AuthRequestDto = {
  email?: string;
  password?: string;
};

export type AuthResponseDto = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: { id: string; email: string };
};

export function requireAuthRequest(body: AuthRequestDto): { email: string; password: string } {
  if (typeof body.email !== 'string' || typeof body.password !== 'string') {
    throw new Error('email and password are required');
  }

  return { email: body.email, password: body.password };
}
