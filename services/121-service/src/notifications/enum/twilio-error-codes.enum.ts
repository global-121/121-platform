/**
 * Twilio error codes
 *
 * Only error codes that are relevant to the 121 service.
 * Used to handle specific errors from Twilio's API responses.
 *
 * @see https://www.twilio.com/docs/api/errors
 */
export const enum TwilioErrorCodes {
  toNumberDoesNotExist = '21211',
  mediaUrlInvalid = '63021',
  failedFreeFormMessage = '63016',
  channelCouldNotFindToAddress = '63003',
}
