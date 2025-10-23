import { hash } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const hashedPassword = await hash(password, 10);
  return hashedPassword;
}
