import { AlfouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.encryption.service';

// Sandbox public key (safe to include: it is a public RSA key).
const PUBLIC_KEY_XML =
  '<RSAParameters><Exponent>AQAB</Exponent><Modulus>zK17xox5Q6D895MBtSPADSYp7Zf/O+6L6vu4bW3N4/8DjRwHto2cAjg++qC0ygVkEbW9jgqUXLbfnJRUvg4s8Q==</Modulus></RSAParameters>';

describe('AlfouadEncryptionService', () => {
  const service = new AlfouadEncryptionService();

  describe('encrypt', () => {
    it('should return a Base64 ciphertext of the expected length for a 512-bit key', () => {
      const result = service.encrypt({
        data: 'FmtRc$$@2026',
        publicKeyXml: PUBLIC_KEY_XML,
      });

      // A 512-bit RSA block is 64 bytes, which is 88 Base64 characters.
      expect(result).toHaveLength(88);
      expect(result).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    });

    it('should produce a different ciphertext each time (PKCS#1 v1.5 padding is randomized)', () => {
      const first = service.encrypt({ data: 'secret', publicKeyXml: PUBLIC_KEY_XML });
      const second = service.encrypt({ data: 'secret', publicKeyXml: PUBLIC_KEY_XML });

      expect(first).not.toBe(second);
    });

    it('should throw when the public key XML is missing Modulus or Exponent', () => {
      expect(() =>
        service.encrypt({ data: 'secret', publicKeyXml: '<RSAParameters />' }),
      ).toThrow('Invalid Al Fouad public key');
    });
  });
});
