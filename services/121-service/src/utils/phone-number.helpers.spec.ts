import {
  formatPhoneNumber,
  formatWhatsAppNumber,
} from './phone-number.helpers';

describe('formatPhoneNumber', () => {
  it('should return a phone-number with "+"-prefix', () => {
    // Arrange
    const tests = [
      {
        in: '123',
        out: '+123',
      },
      {
        in: '+1234567890',
        out: '+1234567890',
      },
      {
        in: 'whatsapp:+1234567890',
        out: '+1234567890',
      },
      {
        in: '+31 6 00 00 00 00',
        out: '+31600000000',
      },
      {
        in: '06-00112233',
        out: '+0600112233',
      },
    ];

    tests.forEach((testCase) => {
      // Act
      const result = formatPhoneNumber(testCase.in);

      // Assert
      expect(result).toBe(testCase.out);
    });
  });

  it('should throw an error for invalid phone-numbers', () => {
    // Arrange
    const tests = ['', null, undefined, '+'];

    tests.forEach((testCase) => {
      // Assert
      expect(() => {
        // Act
        formatPhoneNumber(testCase);
      }).toThrow();
    });
  });
});

describe('formatWhatsAppNumber', () => {
  it('should return a WhatsApp-phone-number with "whatsapp:+"-prefix', () => {
    // Arrange
    const tests = [
      {
        in: '1234567890',
        out: 'whatsapp:+1234567890',
      },
      {
        in: '+1234567890',
        out: 'whatsapp:+1234567890',
      },
      {
        in: 'whatsapp:+1234567890',
        out: 'whatsapp:+1234567890',
      },
    ];

    tests.forEach((testCase) => {
      // Act
      const result = formatWhatsAppNumber(testCase.in);

      // Assert
      expect(result).toBe(testCase.out);
    });
  });

  it('should throw an error for invalid phone-numbers', () => {
    // Arrange
    const tests = ['', null, undefined, 'whatsapp:', 'whatsapp:+'];

    tests.forEach((testCase) => {
      // Assert
      expect(() => {
        // Act
        formatWhatsAppNumber(testCase);
      }).toThrow();
    });
  });
});
