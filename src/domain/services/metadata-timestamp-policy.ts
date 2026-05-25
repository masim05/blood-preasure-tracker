import type { MetadataTimestampSourceTag } from '../../application/ports/image-metadata.port';

export type TimestampCandidate = {
  sourceTag: MetadataTimestampSourceTag;
  rawValue: string;
  normalizedValue: string;
};

const tagPrecedence: MetadataTimestampSourceTag[] = ['DateTimeOriginal', 'CreateDate', 'DateTime'];

export function selectMetadataTimestamp(tags: Record<string, unknown>): TimestampCandidate | null {
  for (const sourceTag of tagPrecedence) {
    const raw = readTag(tags, sourceTag);
    const normalizedValue = normalizeMetadataTimestamp(raw);

    if (raw !== null && normalizedValue !== null) {
      return {
        sourceTag,
        rawValue: String(raw),
        normalizedValue,
      };
    }
  }

  return null;
}

export function normalizeMetadataTimestamp(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatDate(new Date(value * 1000));
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const timestamp = Date.UTC(year, month - 1, day, hour, minute, second);
  const date = new Date(timestamp);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    return null;
  }

  return `${yearText}-${monthText}-${dayText} ${hourText}:${minuteText}:${secondText}`;
}

function readTag(tags: Record<string, unknown>, sourceTag: MetadataTimestampSourceTag): unknown {
  if (sourceTag === 'DateTime') {
    return tags.DateTime ?? tags.ModifyDate ?? null;
  }

  return tags[sourceTag] ?? null;
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hour = date.getUTCHours().toString().padStart(2, '0');
  const minute = date.getUTCMinutes().toString().padStart(2, '0');
  const second = date.getUTCSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
