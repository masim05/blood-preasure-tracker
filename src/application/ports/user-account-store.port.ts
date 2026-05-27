import type { UserAccount } from '../../domain/entities/user-account';

export const USER_ACCOUNT_STORE = Symbol('USER_ACCOUNT_STORE');

export interface UserAccountStorePort {
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: string): Promise<UserAccount | null>;
  save(user: UserAccount): Promise<void>;
}
