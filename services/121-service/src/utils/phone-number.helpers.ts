/**
 * Format a phone number according to international format.
 *
 * @param phoneNumber - The phone number to format
 * @returns The formatted phone number, including "+"-prefix
 */
export function formatPhoneNumber(phoneNumber?: string | null): string {
  if (!phoneNumber) {
    throw new Error('No phone number provided');
  }

  // Strip all (possibly existing) prefixes
  const onlyNumbers = phoneNumber.replace(/\D/g, '');

  // What is left, could be invalid already
  if (!onlyNumbers) {
    throw new Error('No valid phone number provided');
  }

  return '+' + onlyNumbers;
}

/**
 * Format a (WhatsApp-)phone number for use with Twilio as WhatsApp-account
 *
 * @param phoneNumber - The phone number to format
 * @returns The formatted phone number, including "whatsapp:+"-prefix
 */
export function formatWhatsAppNumber(phoneNumber?: string | null): string {
  const phoneNumberWithPlus = formatPhoneNumber(phoneNumber);

  // Return in the format Twilio expects
  return 'whatsapp:' + phoneNumberWithPlus;
}
