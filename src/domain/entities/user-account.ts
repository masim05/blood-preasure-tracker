export type UserAccountProps = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export class UserAccount {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserAccountProps) {
    if (!props.id) {
      throw new Error('UserAccount.id is required');
    }
    if (!props.email) {
      throw new Error('UserAccount.email is required');
    }
    if (!props.passwordHash) {
      throw new Error('UserAccount.passwordHash is required');
    }

    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.createdAt = new Date(props.createdAt);
    this.updatedAt = new Date(props.updatedAt);
  }

  toJSON(): UserAccountProps {
    return {
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt),
    };
  }
}
