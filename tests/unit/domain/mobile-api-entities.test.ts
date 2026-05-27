import { BearerAccessToken } from '../../../src/domain/entities/bearer-access-token';
import { Measurement } from '../../../src/domain/entities/measurement';
import { MeasurementImage } from '../../../src/domain/entities/measurement-image';
import { RecognitionTask } from '../../../src/domain/entities/recognition-task';
import { UserAccount } from '../../../src/domain/entities/user-account';

const now = new Date('2026-05-27T12:00:00.000Z');

describe('mobile API entities', () => {
  it('validates required user account fields', () => {
    const base = { id: 'usr_1', email: 'demo@example.com', passwordHash: 'hash', createdAt: now, updatedAt: now };

    expect(() => new UserAccount({ ...base, id: '' })).toThrow('UserAccount.id is required');
    expect(() => new UserAccount({ ...base, email: '' })).toThrow('UserAccount.email is required');
    expect(() => new UserAccount({ ...base, passwordHash: '' })).toThrow('UserAccount.passwordHash is required');
  });

  it('validates bearer token fields and active state', () => {
    const base = { id: 'tok_1', userId: 'usr_1', tokenHash: 'hash', expiresAt: new Date('2026-05-27T13:00:00.000Z'), createdAt: now, revokedAt: null };

    expect(new BearerAccessToken(base).isActive(now)).toBe(true);
    expect(new BearerAccessToken({ ...base, revokedAt: now }).toJSON().revokedAt).toEqual(now);
    expect(new BearerAccessToken({ ...base, revokedAt: now }).isActive(now)).toBe(false);
    expect(new BearerAccessToken({ ...base, expiresAt: new Date('2026-05-27T11:00:00.000Z') }).isActive(now)).toBe(false);
    expect(() => new BearerAccessToken({ ...base, id: '' })).toThrow('BearerAccessToken.id is required');
    expect(() => new BearerAccessToken({ ...base, userId: '' })).toThrow('BearerAccessToken.userId is required');
    expect(() => new BearerAccessToken({ ...base, tokenHash: '' })).toThrow('BearerAccessToken.tokenHash is required');
  });

  it('validates measurement image and recognition task fields', () => {
    const image = { id: 'img_1', measurementId: 'msr_1', storagePath: '/tmp/img.jpg', contentType: 'image/jpeg' as const, byteSize: 1, createdAt: now };
    const task = { id: 'tsk_1', measurementId: 'msr_1', status: 'queued' as const, attemptCount: 0, lastError: null, availableAt: now, startedAt: null, completedAt: null, createdAt: now, updatedAt: now };

    expect(new MeasurementImage(image).toJSON()).toEqual(image);
    expect(() => new MeasurementImage({ ...image, id: '' })).toThrow('MeasurementImage.id is required');
    expect(() => new MeasurementImage({ ...image, measurementId: '' })).toThrow('MeasurementImage.measurementId is required');
    expect(() => new MeasurementImage({ ...image, storagePath: '' })).toThrow('MeasurementImage.storagePath is required');
    expect(() => new MeasurementImage({ ...image, byteSize: 0 })).toThrow('MeasurementImage.byteSize must be positive');
    expect(new RecognitionTask(task).toJSON()).toEqual(task);
    expect(new RecognitionTask({ ...task, startedAt: now, completedAt: now }).toJSON()).toMatchObject({
      startedAt: now,
      completedAt: now,
    });
    expect(() => new RecognitionTask({ ...task, id: '' })).toThrow('RecognitionTask.id is required');
    expect(() => new RecognitionTask({ ...task, measurementId: '' })).toThrow('RecognitionTask.measurementId is required');
    expect(() => new RecognitionTask({ ...task, attemptCount: -1 })).toThrow('RecognitionTask.attemptCount cannot be negative');
  });

  it('validates measurement lifecycle invariants', () => {
    const base = { id: 'msr_1', userId: 'usr_1', status: 'pending' as const, systolic: null, diastolic: null, pulse: null, armSide: null, measurementTime: now, imageId: 'img_1', recognitionError: null, savedAt: null, createdAt: now, updatedAt: now };

    expect(() => new Measurement({ ...base, id: '' })).toThrow('Measurement.id is required');
    expect(() => new Measurement({ ...base, userId: '' })).toThrow('Measurement.userId is required');
    expect(() => new Measurement({ ...base, status: 'recognized' })).toThrow('Measurement.recognized status requires all recognized values');
    expect(() => new Measurement({ ...base, status: 'saved', systolic: 120, diastolic: 80, pulse: 68, armSide: 'left' })).toThrow('Measurement.saved status requires savedAt');
    expect(() => new Measurement({ ...base, savedAt: now })).toThrow('Measurement.savedAt is only allowed for saved measurements');
  });
});
