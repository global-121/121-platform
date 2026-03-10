import { KoboSubmissionMapper } from '@121-service/src/kobo/mappers/kobo-submission.mapper';

describe('KoboSubmissionMapper', () => {
  const baseSubmission = {
    _id: 1,
    _xform_id_string: 'form-uuid',
    _submission_time: '2025-04-30T15:30:00.000Z',
    _status: 'submitted_via_web',
    __version__: 'v1',
  };

  describe('submission to registration data', () => {
    it('should map submission with string, number, boolean values and special fields (happy flow)', () => {
      // Arrange
      const phoneNumber = '+31612345678';
      const age = 42;
      const isActive = true;
      const fspValue = 'Safaricom';
      const uuidValue = 'unique-submission-id';
      const groupField = 'some-value';

      const submission = {
        ...baseSubmission,
        _uuid: uuidValue,
        phoneNumber,
        age,
        isActive,
        fsp: fspValue,
        group_demographics: groupField,
      };

      // Act
      const result = KoboSubmissionMapper.mapSubmissionToRegistrationData({
        koboSubmission: submission,
      });

      // Assert
      expect(result).toEqual({
        phoneNumber,
        age,
        isActive,
        programFspConfigurationName: fspValue,
        referenceId: uuidValue,
        group_demographics: groupField,
      });
    });

    it('should exclude all metadata fields', () => {
      // Arrange
      const refId = 'ref-id';
      const name = 'John Doe';

      const submission = {
        _id: 123,
        _uuid: refId,
        _xform_id_string: 'form-id',
        _submission_time: '2025-04-30T15:30:00.000Z',
        _status: 'submitted_via_web',
        __version__: 'v1',
        'formhub/uuid': 'formhub-id',
        start: '2025-04-30T15:29:00.000Z',
        end: '2025-04-30T15:30:00.000Z',
        'meta/instanceID': 'instance-id',
        _attachments: [],
        _geolocation: ['1.0', '2.0'],
        _tags: [],
        _notes: [],
        _validation_status: 'approved',
        _submitted_by: 'user123',
        name,
      };

      // Act
      const result = KoboSubmissionMapper.mapSubmissionToRegistrationData({
        koboSubmission: submission,
      });

      // Assert
      expect(result).toEqual({
        referenceId: refId,
        name,
      });
    });

    it('should map fsp and _uuid fields to special attribute names', () => {
      // Arrange
      const fspValue = 'Iron Bank';
      const uuidValue = 'submission-uuid-12345';

      const submission = {
        ...baseSubmission,
        _uuid: uuidValue,
        fsp: fspValue,
      };

      // Act
      const result = KoboSubmissionMapper.mapSubmissionToRegistrationData({
        koboSubmission: submission,
      });

      // Assert
      expect(result).toEqual({
        referenceId: uuidValue,
        programFspConfigurationName: fspValue,
      });
    });

    it('should throw error when submission contains unsupported type', () => {
      // Arrange
      const unsupportedKey = 'attachmentList';
      const unsupportedValue = ['file1.pdf', 'file2.pdf'];

      const submission = {
        ...baseSubmission,
        _uuid: 'ref',
        phoneNumber: '+31612345678',
        [unsupportedKey]: unsupportedValue,
      };

      // Act & Assert
      expect(() =>
        KoboSubmissionMapper.mapSubmissionToRegistrationData({
          koboSubmission: submission,
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `"Unsupported Kobo submission value type for key "attachmentList". Only string, number, and boolean values are supported."`,
      );
    });
  });
});
