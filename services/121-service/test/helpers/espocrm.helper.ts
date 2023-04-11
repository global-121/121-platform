import crypto from 'crypto';
import { EspoCrmActionTypeEnum } from '../../src/espocrm/espocrm-action-type.enum';
import { EspoCrmEntityTypeEnum } from '../../src/espocrm/espocrm-entity-type';
import { publishProgram } from './program.helper';
import { getAccessToken, getServer } from './utility.helper';

function encodeBase64(data: string): string {
  return Buffer.from(data, 'binary').toString('base64');
}

export function createEspoSignature(
  payload: any,
  secret: string,
  webhookId: string,
): string {
  const stringifiedBody = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret).update(stringifiedBody);
  const hmacString = hmac.digest().toString('binary');
  const concatString = webhookId + ':' + hmacString;
  const base64encodedString = encodeBase64(concatString);

  return base64encodedString;
}

export async function setupEspoCrmWebhook(
  programId: number,
  payload: {
    referenceId: string;
    actionType: EspoCrmActionTypeEnum;
    entityType: EspoCrmEntityTypeEnum;
    secretKey: string;
  },
): Promise<string> {
  const accessToken = await getAccessToken();

  await publishProgram(programId);

  await getServer()
    .post('/espocrm/webhooks')
    .set('Cookie', [accessToken])
    .send(payload);

  return accessToken;
}
