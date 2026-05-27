import { SubmitMeasurementImageUseCase } from '../../../src/application/use-cases/submit-measurement-image.use-case';
import {
  InMemoryMeasurementImageStore,
  InMemoryMeasurementStore,
  InMemoryRecognitionTaskStore,
} from '../../helpers/mobile-api-fakes';

const now = new Date('2026-05-27T12:00:00.000Z');

describe('SubmitMeasurementImageUseCase focused coverage', () => {
  it('stores accepted image data with server-assigned time and recognition task', async () => {
    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const tasks = new InMemoryRecognitionTaskStore();

    const output = await new SubmitMeasurementImageUseCase(measurements, images, tasks).execute({
      userId: 'usr_1',
      contentType: 'image/png',
      originalName: 'reading.png',
      data: Buffer.from('png'),
      now,
    });

    expect(output.measurementTime).toBe(now.toISOString());
    expect(measurements.measurements.get(output.id)?.imageId).toMatch(/^img_/);
    expect([...tasks.tasks.values()][0].measurementId).toBe(output.id);
  });
});
