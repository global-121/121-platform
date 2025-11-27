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
});
