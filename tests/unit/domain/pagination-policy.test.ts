import { validatePagination } from '../../../src/domain/services/pagination-policy';

describe('pagination policy', () => {
  it('applies defaults and accepts valid filters', () => {
    expect(
      validatePagination({ from: new Date('2026-05-01T00:00:00.000Z'), to: new Date('2026-05-31T00:00:00.000Z') }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      from: new Date('2026-05-01T00:00:00.000Z'),
      to: new Date('2026-05-31T00:00:00.000Z'),
    });
  });

  it('rejects invalid page, pageSize, time, and ranges', () => {
    expect(() => validatePagination({ page: 0 })).toThrow('page must be a positive integer');
    expect(() => validatePagination({ pageSize: 101 })).toThrow('pageSize must be between 1 and 100');
    expect(() => validatePagination({ from: new Date('invalid') })).toThrow('from must be a valid ISO-8601 timestamp');
    expect(() =>
      validatePagination({ from: new Date('2026-06-01T00:00:00.000Z'), to: new Date('2026-05-01T00:00:00.000Z') }),
    ).toThrow('from must be before or equal to to');
  });
});
