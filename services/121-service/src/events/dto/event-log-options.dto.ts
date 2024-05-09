import { EventAttributeKeyEnum } from '@121-service/src/events/enum/event-attribute-key.enum';

/**
 * Data Transfer Object for event log options.
 */
export class EventLogOptionsDto {
  /**
   * An array of registration attributes which will be logged if they have been changed. The default is to check all registration attributes.
   * This is required when using partial RegistrationViewEntities
   */
  registrationAttributes?: string[];

  /**
   * An object of additional log attributes, for example the reason
   * The keys are attribute names and the values are attribute values.
   */
  additionalLogAttributes?: {
    [K in EventAttributeKeyEnum]?: string | undefined;
  };
}
