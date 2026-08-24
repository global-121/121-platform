import { AlfouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.encryption.service';

const PUBLIC_KEY_XML =
  '<RSAParameters><Exponent>AQAB</Exponent><Modulus>x1t3Rzjn9Q7CD02KMUnYnwQxcXbfVtFy7mhpq0eLp7HgRH7x3MZ/FN4rZxNLj/CoyAyFMCgQLVYUZeIHWkyp450LldfG77VNARnntDOEbcMIZOvdR690sO4XzSIxbY3UScuCidL0iqHjsxRA+rhLkQwPvqWn++gR6pQufbHz4vM=</Modulus></RSAParameters>';

describe('AlfouadEncryptionService', () => {
  const service = new AlfouadEncryptionService();

  describe('Encrypting data with the public key', () => {
    it('should return a Base64 ciphertext matching the key size', () => {
      const result = service.encrypt({
        data: 'FmtRc$$@2026',
        publicKeyXml: PUBLIC_KEY_XML,
      });

      expect(Buffer.from(result, 'base64')).toHaveLength(128);
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
