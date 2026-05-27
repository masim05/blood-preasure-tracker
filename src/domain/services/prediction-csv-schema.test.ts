import { formatCsvCell, formatCsvRow } from './csv-formatting';
import {
  formatPredictionCsvHeader,
  formatPredictionCsvRow,
  predictionCsvHeader,
} from './prediction-csv-schema';

describe('prediction CSV schema', () => {
  it('uses the fixed prediction CSV header', () => {
    expect(formatPredictionCsvHeader()).toBe(
      'imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes',
    );
    expect(predictionCsvHeader).toEqual([
      'imageId',
      'time',
      'hand',
      'systolic',
      'diastolic',
      'pulse',
      'status',
      'confidence',
      'uncertainFields',
      'provider',
      'model',
      'rawNotes',
    ]);
  });

  it('formats nulls, numbers, quotes, commas, and line breaks as CSV cells', () => {
    expect(formatCsvCell(null)).toBe('');
    expect(formatCsvCell(127)).toBe('127');
    expect(formatCsvCell('plain')).toBe('plain');
    expect(formatCsvCell('left,right')).toBe('"left,right"');
    expect(formatCsvCell('said "ok"')).toBe('"said ""ok"""');
    expect(formatCsvCell('line\nbreak')).toBe('"line\nbreak"');
    expect(formatCsvRow(['img001', null, 69])).toBe('img001,,69');
  });

  it('formats prediction rows with empty null cells and JSON uncertain fields', () => {
    expect(
      formatPredictionCsvRow({
        imageId: 'img002',
        imagePath: 'data/img002.jpg',
        time: null,
        hand: 'right',
        systolic: 127,
        diastolic: 72,
        pulse: 69,
        status: 'partial',
        confidence: 0.82,
        uncertainFields: ['time'],
        provider: 'openai',
        model: 'gpt-5.4-mini',
        rawNotes: 'No timestamp, provider said "ok"',
      }),
    ).toBe('img002,,right,127,72,69,partial,0.82,"[""time""]",openai,gpt-5.4-mini,"No timestamp, provider said ""ok"""');
  });
});