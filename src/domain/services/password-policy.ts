export const MIN_PASSWORD_LENGTH = 8;

export function validatePassword(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error('password must be at least 8 characters');
  }
}
