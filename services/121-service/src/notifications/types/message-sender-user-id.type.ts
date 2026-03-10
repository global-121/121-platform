/**
 * The ID of the user who triggered sending a message.
 * Is `null` when the message is sent by the system rather than a user.
 * This can happen for example when a new registration is created when a new Kobo submission comes in and that a message is then sent based on that registration creation, but there is no user action that triggered this.
 */
export type MessageSenderUserId = number | null;
