import type { BearerAccessToken } from '../domain/entities/bearer-access-token';
import type { Measurement } from '../domain/entities/measurement';
import type { MeasurementImage } from '../domain/entities/measurement-image';
import { RecognitionTask } from '../domain/entities/recognition-task';
import type { UserAccount } from '../domain/entities/user-account';
import type {
  BearerTokenGeneratorPort,
  BearerTokenStorePort,
} from '../application/ports/bearer-token-store.port';
import type {
  MeasurementImageStorePort,
  StoreMeasurementImageInput,
  StoredMeasurementImageData,
} from '../application/ports/measurement-image-store.port';
import type {
  ListMeasurementsFilter,
  MeasurementHistoryPage,
  MeasurementStorePort,
} from '../application/ports/measurement-store.port';
import type { PasswordHasherPort } from '../application/ports/password-hasher.port';
import type { RecognitionTaskStorePort } from '../application/ports/recognition-task-store.port';
import type { UserAccountStorePort } from '../application/ports/user-account-store.port';
import { MeasurementImage as MeasurementImageEntity } from '../domain/entities/measurement-image';

export class InMemoryUserStore implements UserAccountStorePort {
  readonly users = new Map<string, UserAccount>();

  async findByEmail(email: string): Promise<UserAccount | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<UserAccount | null> {
    return this.users.get(id) ?? null;
  }

  async save(user: UserAccount): Promise<void> {
    this.users.set(user.id, user);
  }
}

export class InMemoryBearerTokenStore implements BearerTokenStorePort {
  readonly tokens = new Map<string, BearerAccessToken>();

  async findByHash(tokenHash: string): Promise<BearerAccessToken | null> {
    return [...this.tokens.values()].find((token) => token.tokenHash === tokenHash) ?? null;
  }

  async save(token: BearerAccessToken): Promise<void> {
    this.tokens.set(token.id, token);
  }
}

export class StaticTokenGenerator implements BearerTokenGeneratorPort {
  constructor(private readonly token = 'raw-token') {}

  generate(): string {
    return this.token;
  }

  hash(token: string): string {
    return `hash:${token}`;
  }
}

export class SimplePasswordHasher implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }
}

export class InMemoryMeasurementStore implements MeasurementStorePort {
  readonly measurements = new Map<string, Measurement>();

  async findById(id: string): Promise<Measurement | null> {
    return this.measurements.get(id) ?? null;
  }

  async findByIdForUser(id: string, userId: string): Promise<Measurement | null> {
    const measurement = this.measurements.get(id) ?? null;
    return measurement?.userId === userId ? measurement : null;
  }

  async save(measurement: Measurement): Promise<void> {
    this.measurements.set(measurement.id, measurement);
  }

  async listSavedForUser(filter: ListMeasurementsFilter): Promise<MeasurementHistoryPage> {
    const filtered = [...this.measurements.values()]
      .filter((measurement) => measurement.userId === filter.userId && measurement.status === 'saved')
      .filter(
        (measurement) =>
          (!filter.from || measurement.measurementTime >= filter.from) &&
          (!filter.to || measurement.measurementTime <= filter.to),
      )
      .sort((left, right) => right.measurementTime.getTime() - left.measurementTime.getTime());
    const start = (filter.page - 1) * filter.pageSize;

    return {
      items: filtered.slice(start, start + filter.pageSize),
      page: filter.page,
      pageSize: filter.pageSize,
      hasNextPage: filtered.length > start + filter.pageSize,
      from: filter.from,
      to: filter.to,
    };
  }
}

export class InMemoryMeasurementImageStore implements MeasurementImageStorePort {
  readonly images = new Map<string, StoredMeasurementImageData>();

  async save(input: StoreMeasurementImageInput): Promise<MeasurementImage> {
    const image = new MeasurementImageEntity({
      id: input.id,
      measurementId: input.measurementId,
      storagePath: `/tmp/${input.originalName}`,
      contentType: input.contentType,
      byteSize: input.data.byteLength,
      createdAt: input.createdAt,
    });
    this.images.set(input.measurementId, { image, data: input.data });
    return image;
  }

  async findByMeasurementId(measurementId: string): Promise<MeasurementImage | null> {
    return this.images.get(measurementId)?.image ?? null;
  }

  async readByMeasurementId(measurementId: string): Promise<StoredMeasurementImageData | null> {
    return this.images.get(measurementId) ?? null;
  }

  getImageUrl(measurementId: string): string {
    return `/api/v1/measurements/${measurementId}/image`;
  }
}

export class InMemoryRecognitionTaskStore implements RecognitionTaskStorePort {
  readonly tasks = new Map<string, RecognitionTask>();

  async findById(id: string): Promise<RecognitionTask | null> {
    return this.tasks.get(id) ?? null;
  }

  async claimQueued(now: Date, batchSize: number): Promise<RecognitionTask[]> {
    const queued = [...this.tasks.values()]
      .filter((task) => task.status === 'queued' && task.availableAt <= now)
      .sort((left, right) => {
        const availableAtOrder = left.availableAt.getTime() - right.availableAt.getTime();
        if (availableAtOrder !== 0) {
          return availableAtOrder;
        }

        return left.createdAt.getTime() - right.createdAt.getTime();
      })
      .slice(0, batchSize)
      .map(
        (task) =>
          new RecognitionTask({
            ...task.toJSON(),
            status: 'processing',
            attemptCount: task.attemptCount + 1,
            startedAt: now,
            updatedAt: now,
          }),
      );

    for (const task of queued) {
      this.tasks.set(task.id, task);
    }

    return queued;
  }

  async scheduleRetry(taskId: string, availableAt: Date, lastError: string, now: Date): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    this.tasks.set(
      taskId,
      new RecognitionTask({
        ...task.toJSON(),
        status: 'queued',
        lastError,
        availableAt,
        startedAt: null,
        updatedAt: now,
      }),
    );
  }

  async save(task: RecognitionTask): Promise<void> {
    this.tasks.set(task.id, task);
  }
}
