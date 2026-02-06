import fs from 'node:fs';
import https from 'node:https';

import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('fs');

describe('CustomHttpService', () => {
  let service: CustomHttpService;

  beforeEach(() => {
    service = new CustomHttpService({} as any);
  });

  describe('createHttpsAgentWithCertificate', () => {
    it('should create an HTTPS agent with a certificate and passphrase', () => {
      const certificatePath = 'path/to/certificate.p12';
      const password = 'test-password';
      const dummyCertificate = Buffer.from('dummy-certificate');

      (fs.readFileSync as jest.Mock).mockReturnValue(dummyCertificate);

      const agent = service.createHttpsAgentWithCertificate(
        certificatePath,
        password,
      );

      expect(agent).toBeInstanceOf(https.Agent);
      expect(agent.options.pfx).toBe(dummyCertificate);
      expect(agent.options.passphrase).toBe(password);
    });

    it('should create an HTTPS agent with a certificate without passphrase', () => {
      const certificatePath = 'path/to/certificate.p12';
      const dummyCertificate = Buffer.from('dummy-certificate');

      (fs.readFileSync as jest.Mock).mockReturnValue(dummyCertificate);

      const agent = service.createHttpsAgentWithCertificate(certificatePath);

      expect(agent).toBeInstanceOf(https.Agent);
      expect(agent.options.pfx).toBe(dummyCertificate);
      expect(agent.options.passphrase).toBeUndefined();
    });
  });

  describe('createHttpsAgentWithSelfSignedCertificateOnly', () => {
    it('should create an HTTPS agent with a self-signed certificate and extra options', () => {
      const certificatePath = 'path/to/certificate.crt';
      const dummyCertificate = Buffer.from('dummy-ca-certificate');
      const extraOpts = { keepAlive: true, maxSockets: 50 };

      (fs.readFileSync as jest.Mock).mockReturnValue(dummyCertificate);

      const agent = service.createHttpsAgentWithSelfSignedCertificateOnly(
        certificatePath,
        extraOpts,
      );

      expect(agent).toBeInstanceOf(https.Agent);
      expect(agent.options.ca).toBe(dummyCertificate);
      expect(agent.options.keepAlive).toBe(true);
      expect(agent.options.maxSockets).toBe(50);
    });

    it('should throw an error if self-signed certificate file is not found', () => {
      const certificatePath = 'path/to/nonexistent.crt';
      const fileError = new Error('ENOENT: no such file or directory');

      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw fileError;
      });

      expect(() => {
        service.createHttpsAgentWithSelfSignedCertificateOnly(certificatePath);
      }).toThrowErrorMatchingInlineSnapshot(`
       "Certificate not found at: path/to/nonexistent.crt
       Cause: ENOENT: no such file or directory"
      `);
    });
  });
});
