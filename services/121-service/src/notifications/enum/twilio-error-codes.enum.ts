// Enum for Twilio error codes
// This enumm contains only error codes that are relevant to the 121 service
// It is used to handle specific errors from Twilio's API responses
// Reference: https://www.twilio.com/docs/api/errors
export enum TwilioErrorCodes {
  toNumberDoesNotExist = 21211,
  mediaUrlInvalid = 63021,
  failedFreeFormMessage = 63016,
  channelCouldNotFindToAddress = 63003,
}
