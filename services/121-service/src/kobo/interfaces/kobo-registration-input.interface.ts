/**
 * Represents registration data produced by mapping a Kobo submission.
 * Used as input for validation and import of Kobo submissions into registrations.
 *
 * `referenceId` is always defined because {@link KoboSubmissionMapper.mapSubmissionToRegistrationData}
 * initialises it from `koboSubmission._uuid`, which is a required field on every Kobo submission.
 */
export type KoboRegistrationInput = { referenceId: string } & Record<
  string,
  string | boolean | number
>;
