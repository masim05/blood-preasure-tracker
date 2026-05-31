import { ListMeasurementsUseCase } from './list-measurements.use-case';
import { Measurement } from '../../domain/entities/measurement';
import { InMemoryMeasurementStore } from '../../test-support/mobile-api-fakes';

const now = new Date('2026-05-27T12:00:00.000Z');

describe('ListMeasurementsUseCase focused coverage', () => {
  it('returns recognized and saved owned measurements with pagination metadata', async () => {
    const measurements = new InMemoryMeasurementStore();
    await measurements.save(
      new Measurement({
        id: 'msr_0',
        userId: 'usr_1',
        status: 'recognized',
        systolic: 118,
        diastolic: 78,
        pulse: 66,
        armSide: 'right',
        measurementTime: new Date('2026-05-27T11:30:00.000Z'),
        imageId: 'img_0',
        recognitionError: null,
        savedAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    );
    await measurements.save(
      new Measurement({
        id: 'msr_1',
        userId: 'usr_1',
        status: 'saved',
        systolic: 120,
        diastolic: 80,
        pulse: 68,
        armSide: 'left',
        measurementTime: now,
        imageId: 'img_1',
        recognitionError: null,
        savedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    );

    const output = await new ListMeasurementsUseCase(measurements).execute({ userId: 'usr_1' });

    expect(output).toMatchObject({
      items: [
        { id: 'msr_1', status: 'saved', systolic: 120, savedAt: now.toISOString() },
        { id: 'msr_0', status: 'recognized', systolic: 118, savedAt: null },
      ],
      page: 1,
      pageSize: 20,
      hasNextPage: false,
    });
  });
});
