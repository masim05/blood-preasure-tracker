import { ListMeasurementsUseCase } from '../../../src/application/use-cases/list-measurements.use-case';
import { Measurement } from '../../../src/domain/entities/measurement';
import { InMemoryMeasurementStore } from '../../helpers/mobile-api-fakes';

const now = new Date('2026-05-27T12:00:00.000Z');

describe('ListMeasurementsUseCase focused coverage', () => {
  it('returns only saved owned measurements with pagination metadata', async () => {
    const measurements = new InMemoryMeasurementStore();
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
      items: [{ id: 'msr_1', status: 'saved', systolic: 120 }],
      page: 1,
      pageSize: 20,
      hasNextPage: false,
    });
  });
});
