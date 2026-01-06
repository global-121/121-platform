import { env } from '@121-service/src/env';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getApprovers } from '@121-service/test/helpers/user.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Seed with different approverMode options', () => {
  let accessToken: string;

  beforeEach(async () => {
    accessToken = await getAccessToken();
  });

  it('should configure admin-user as approver if mode=admin', async () => {
    // Act
    await resetDB(
      SeedScript.nlrcMultiple,
      __filename,
      undefined,
      ApproverSeedMode.admin,
    );

    // Assert
    for (const programId of [programIdOCW, programIdPV]) {
      const getResponse = await getApprovers({
        programId,
        accessToken,
      });
      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].username).toBe(
        env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      );
    }
  });

  it('should configure no approvers if mode=none', async () => {
    // Act
    await resetDB(
      SeedScript.nlrcMultiple,
      __filename,
      undefined,
      ApproverSeedMode.none,
    );

    // Assert
    for (const programId of [programIdOCW, programIdPV]) {
      const getResponse = await getApprovers({
        programId,
        accessToken,
      });
      expect(getResponse.body).toHaveLength(0);
    }
  });

  it('should configure demo-user as approver if mode=demo', async () => {
    // Act
    await resetDB(
      SeedScript.nlrcMultiple,
      __filename,
      undefined,
      ApproverSeedMode.demo,
    );

    // Assert
    for (const programId of [programIdOCW, programIdPV]) {
      const getResponse = await getApprovers({
        programId,
        accessToken,
      });
      expect(getResponse.body).toHaveLength(2);
      const usernames = getResponse.body.map((u) => u.username);
      expect(usernames).toContain(env.USERCONFIG_121_SERVICE_EMAIL_ADMIN);
      expect(usernames).toContain(env.USERCONFIG_121_SERVICE_EMAIL_APPROVER);
    }
  });

  it('should default to admin approvers (on development) if no mode is provided', async () => {
    // Act
    await resetDB(SeedScript.nlrcMultiple, __filename);

    // Assert
    for (const programId of [programIdOCW, programIdPV]) {
      const getResponse = await getApprovers({
        programId,
        accessToken,
      });
      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].username).toBe(
        env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      );
    }
  });
});
