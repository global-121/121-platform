export enum TwilioMode {
  /**
   * Twilio messaging is turned off for this instance. The Twilio client is
   * still constructed (using placeholder credentials) so it can be imported,
   * but messages are never enqueued/sent, and phone-number lookups are
   * skipped and passed through unchanged. In this mode the Twilio environment
   * variables do not need to be set.
   *
   * This is the default value.
   */
  disabled = 'DISABLED',

  /**
   * The 121-service talks to the mock service instead of the real Twilio API.
   * In this mode incoming-webhook signature validation is skipped and mock
   * message metadata is added to outgoing messages.
   *
   * This is used:
   * - locally (dev and testing)
   * - in CI
   * - in environments where we don't want to use the real external service
   */
  mock = 'MOCK',

  /**
   * The 121-service talks to the real Twilio API. In this mode all Twilio
   * environment variables must be set and incoming webhooks are validated
   * using the Twilio signature.
   *
   * Reminder: when messaging runs against real Twilio, every program is
   * expected to have a `phoneNumber` registration attribute (type `tel`) so
   * that messages can actually be sent.
   *
   * This is used:
   * - in demo/staging environments
   * - in production
   */
  external = 'EXTERNAL',
}
