import {
  normalizeMetadataTimestamp,
  selectMetadataTimestamp,
} from './metadata-timestamp-policy';

describe('metadata timestamp policy', () => {
  it('normalizes EXIF timestamps to the CLI timestamp format', () => {
    expect(normalizeMetadataTimestamp('2026:05:19 06:05:20')).toBe('2026-05-19 06:05:20');
  });

  it('normalizes numeric EXIF timestamps without adding timezone text', () => {
    expect(normalizeMetadataTimestamp(1779170720)).toBe('2026-05-19 06:05:20');
  });

  it('prefers DateTimeOriginal over CreateDate and DateTime', () => {
    expect(
      selectMetadataTimestamp({
        DateTimeOriginal: '2026:05:19 06:05:20',
        CreateDate: '2026:05:19 06:06:20',
        DateTime: '2026:05:19 06:07:20',
      }),
    ).toEqual({
      sourceTag: 'DateTimeOriginal',
      rawValue: '2026:05:19 06:05:20',
      normalizedValue: '2026-05-19 06:05:20',
    });
  });

  it('uses CreateDate when DateTimeOriginal is absent', () => {
    expect(
      selectMetadataTimestamp({
        CreateDate: '2026:05:19 06:06:20',
        DateTime: '2026:05:19 06:07:20',
      })?.sourceTag,
    ).toBe('CreateDate');
  });

  it('uses generic DateTime from ModifyDate when parser renames the tag', () => {
    expect(
      selectMetadataTimestamp({
        ModifyDate: '2026:05:19 06:07:20',
      }),
    ).toEqual({
      sourceTag: 'DateTime',
      rawValue: '2026:05:19 06:07:20',
      normalizedValue: '2026-05-19 06:07:20',
    });
  });

  it('rejects malformed timestamps and timezone-bearing strings', () => {
    expect(normalizeMetadataTimestamp('2026:99:19 06:05:20')).toBeNull();
    expect(normalizeMetadataTimestamp('2026:05:19 06:05:20 +07:00')).toBeNull();
    expect(selectMetadataTimestamp({ DateTimeOriginal: 'not-a-time' })).toBeNull();
  });
});
