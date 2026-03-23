import { buildTemplateImportValidationFailed } from '@121-service/src/registrations-update-jobs/registrations-update-job-emails/templates/import-validation-failed.template';

describe('Registration update job email templates', () => {
  it('should render import validation failed template', () => {
    expect(
      buildTemplateImportValidationFailed({
        email: 'owner@example.com',
        displayName: 'Owner User',
        attachment: {
          name: 'failed-validations.csv',
          contentBytes: 'dGVzdC1kYXRh',
        },
      }),
    ).toMatchSnapshot();
  });
});
