import {
  CSVRecord,
  formatRecordsAsCsv,
} from '@121-service/src/utils/format-records-as-csv.helper';

const decodeBase64 = (value: string): string =>
  Buffer.from(value, 'base64').toString('utf8');

describe('formatRecordsAsCsv', () => {
  it('formats a simple array of records as base64 CSV', () => {
    const records: CSVRecord[] = [
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ];

    const result = formatRecordsAsCsv(records);
    expect(decodeBase64(result)).toBe('a,b\n1,2\n3,4\n');
  });

  it('escapes values and preserves header order', () => {
    const records: CSVRecord[] = [
      { foo: 'bar,qux', baz: '"quoted"' },
      { foo: 'plain', baz: 'multi\nline' },
    ];

    const result = formatRecordsAsCsv(records);
    expect(decodeBase64(result)).toBe(
      'foo,baz\n"bar,qux","""quoted"""\nplain,"multi\nline"\n',
    );
  });
});
