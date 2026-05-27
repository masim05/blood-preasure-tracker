import { Measurement } from '../../../src/domain/entities/measurement';
import {
  completeRecognition,
  failRecognition,
  saveRecognizedMeasurement,
  startRecognition,
} from '../../../src/domain/services/measurement-state-policy';

const now = new Date('2026-05-27T12:00:00.000Z');

function measurement(status: 'pending' | 'recognizing' | 'recognized' | 'saved' | 'failed'): Measurement {
  return new Measurement({
    id: 'msr_1',
    userId: 'usr_1',
    status,
    systolic: status === 'recognized' || status === 'saved' ? 120 : null,
    diastolic: status === 'recognized' || status === 'saved' ? 80 : null,
    pulse: status === 'recognized' || status === 'saved' ? 68 : null,
    armSide: status === 'recognized' || status === 'saved' ? 'left' : null,
    measurementTime: now,
    imageId: 'img_1',
    recognitionError: null,
    savedAt: status === 'saved' ? now : null,
    createdAt: now,
    updatedAt: now,
  });
}

describe('measurement state policy', () => {
  it('moves pending measurements through recognition and save', () => {
    const recognizing = startRecognition(measurement('pending'), now);
    const recognized = completeRecognition(
      recognizing,
      { systolic: 121, diastolic: 81, pulse: 69, armSide: 'right' },
      now,
    );
    const saved = saveRecognizedMeasurement(recognized, now);

    expect(saved.status).toBe('saved');
    expect(saved.systolic).toBe(121);
  });

  it('records failed recognition', () => {
    expect(failRecognition(measurement('recognizing'), 'Could not read image', now).recognitionError).toBe('Could not read image');
  });

  it('rejects invalid transitions', () => {
    expect(() => saveRecognizedMeasurement(measurement('pending'), now)).toThrow('measurement cannot transition from pending to saved');
  });
});
