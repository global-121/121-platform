/**
 * Interface for event log options.
 *
 * @example
 * // With event log options
 * const eventLogOptions: EventLogOptions = {
 *   explicitRegistrationPropertyNames: ['phoneNumber'],
 *   reason: 'Person has a new phone',
 * };
 * await log(oldRegistration, newRegistration, eventLogOptions);
 */
export interface EventLogOptions {
  /**
   * An array of registration property names which will be logged if they have been changed.
   * The default is to check all registration properties.
   * This is required when using partial RegistrationViewEntities.
   *
   * @example
   * const eventLogOptions: EventLogOptions = {
   *   explicitRegistrationPropertyNames: ['phoneNumber', 'email'],
   * };
   */
  explicitRegistrationPropertyNames?: string[];

  /**
   * The reason for the log entry.
   *
   * @example
   * const eventLogOptions: EventLogOptions = {
   *   reason: 'Person has a new phone',
   * };
   */
  reason?: string;
}
