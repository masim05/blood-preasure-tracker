export type BearerAccessTokenProps = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
};

export class BearerAccessToken {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly revokedAt: Date | null;

  constructor(props: BearerAccessTokenProps) {
    if (!props.id) {
      throw new Error('BearerAccessToken.id is required');
    }
    if (!props.userId) {
      throw new Error('BearerAccessToken.userId is required');
    }
    if (!props.tokenHash) {
      throw new Error('BearerAccessToken.tokenHash is required');
    }

    this.id = props.id;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.expiresAt = new Date(props.expiresAt);
    this.createdAt = new Date(props.createdAt);
    this.revokedAt = props.revokedAt ? new Date(props.revokedAt) : null;
  }

  isActive(now: Date): boolean {
    return this.revokedAt === null && this.expiresAt.getTime() > now.getTime();
  }

  toJSON(): BearerAccessTokenProps {
    return {
      id: this.id,
      userId: this.userId,
      tokenHash: this.tokenHash,
      expiresAt: new Date(this.expiresAt),
      createdAt: new Date(this.createdAt),
      revokedAt: this.revokedAt ? new Date(this.revokedAt) : null,
    };
  }
}
