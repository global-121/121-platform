import { InstanceReportingRegistrationDto } from '@121-service/src/instance-reporting/dtos/instance-reporting-registration.dto';
import { InstanceReportingCsvMapper } from '@121-service/src/instance-reporting/mappers/instance-reporting-csv.mapper';

describe('InstanceReportingCsvMapper', () => {
  describe('mapping an item to a CSV row', () => {
    it('should map a registration to a CSV row using headers', () => {
      const registration: InstanceReportingRegistrationDto = {
        instance: 'test',
        version: '1',
        programTitle: 'Cash for Work',
        programId: 1,
        status: 'included',
        referenceId: 'ref-1',
        uploadDate: '2026-04-20',
      };

      const row = InstanceReportingCsvMapper.mapItemToCsvRow({
        headers: InstanceReportingCsvMapper.registrationHeaders,
        item: registration,
      });

      expect(row).toBe('test,1,Cash for Work,1,included,ref-1,2026-04-20\n');
    });

    it('should wrap values containing commas in quotes', () => {
      const row = InstanceReportingCsvMapper.mapItemToCsvRow({
        headers: ['field'] as const,
        item: { field: 'Aid, Program' },
      });

      expect(row).toBe('"Aid, Program"\n');
    });

    it('should escape double quotes by doubling them', () => {
      const row = InstanceReportingCsvMapper.mapItemToCsvRow({
        headers: ['field'] as const,
        item: { field: 'Aid "Program"' },
      });

      expect(row).toBe('"Aid ""Program"""\n');
    });

    it('should render null values as empty fields', () => {
      const row = InstanceReportingCsvMapper.mapItemToCsvRow({
        headers: ['field'] as const,
        item: { field: null },
      });

      expect(row).toBe('\n');
    });

    it('should wrap values containing newlines in quotes', () => {
      const row = InstanceReportingCsvMapper.mapItemToCsvRow({
        headers: ['field'] as const,
        item: { field: 'Line1\nLine2' },
      });

      expect(row).toBe('"Line1\nLine2"\n');
    });

    it('should wrap values containing carriage returns in quotes', () => {
      const row = InstanceReportingCsvMapper.mapItemToCsvRow({
        headers: ['field'] as const,
        item: { field: 'Line1\rLine2' },
      });

      expect(row).toBe('"Line1\rLine2"\n');
    });

    it('should convert numbers to strings', () => {
      const row = InstanceReportingCsvMapper.mapItemToCsvRow({
        headers: ['field'] as const,
        item: { field: 42 },
      });

      expect(row).toBe('42\n');
    });
  });

  describe('joining values into a CSV row', () => {
    it('should join values with commas and append a newline', () => {
      expect(
        InstanceReportingCsvMapper.toCsvRow({ values: ['a', 'b', 'c'] }),
      ).toBe('a,b,c\n');
    });
  });
});
