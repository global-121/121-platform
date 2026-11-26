import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LOGIN_ONE_TIME_PASSWORD_EMAIL_SUBJECT } from '@121-service/src/user/user-emails/user-emails.const';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import {
  deleteAllEmails,
  waitForEmail,
} from '@121-e2e/portal/helpers/mailpit.helper';

const adminEmail = env.USERCONFIG_121_SERVICE_EMAIL_ADMIN;

const extractOneTimePassword = ({ html }: { html: string }): string => {
  const match = /<code>([0-9A-Z]{6})<\/code>/.exec(html);

  if (!match) {
    throw new Error('No one-time password found in the email');
  }

  return match[1];
};

test.beforeEach(async ({ onlyResetAndSeedRegistrations }) => {
  await onlyResetAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
  });
  await deleteAllEmails();
});

test('[Admin] Log in with a one-time password received by email', async ({
  loginPage,
}) => {
  let oneTimePassword: string;

  await test.step('Request a one-time password', async () => {
    await loginPage.requestOneTimePassword({ email: adminEmail });
  });

  await test.step('Read the one-time password from the email', async () => {
    const email = await waitForEmail({
      recipient: adminEmail,
      subject: LOGIN_ONE_TIME_PASSWORD_EMAIL_SUBJECT,
    });

    oneTimePassword = extractOneTimePassword({ html: email.HTML });
  });

  await test.step('Log in with the one-time password', async () => {
    await loginPage.loginWithOneTimePassword({ oneTimePassword });
  });
});
