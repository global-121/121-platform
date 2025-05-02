import { Buffer } from 'node:buffer';
import { publicEncrypt } from 'node:crypto';
const { constants } = await import('node:crypto');

const rsaKeyToPem = (key: string): string => {
  const formattedKey = `-----BEGIN PUBLIC KEY-----\n${key
    .match(/.{1,64}/g)
    ?.join('\n')}\n-----END PUBLIC KEY-----`;
  return formattedKey;
};

export const encryptPin = (data: string, base64PublicKey: string): string => {
  const publicKey = rsaKeyToPem(base64PublicKey);
  const encrypted = publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(data),
  );
  return encrypted.toString('base64');
};

export const getAccessToken = async ({
  url,
  client_id,
  client_secret,
}): Promise<string> => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: '*/*',
  };

  const body = JSON.stringify({
    client_id,
    client_secret,
    grant_type: 'client_credentials',
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Failed to fetch access token: ${response.status} ${response.statusText} - ${errorDetails}`,
      );
    }

    const { access_token } = (await response.json()) as {
      access_token: string;
      expires_in: string;
      token_type: string;
    };
    return access_token;
  } catch (error) {
    console.error(
      'Error fetching access token:',
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};

export const generateRandomId = (length = 40): string => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const postTransaction = async ({
  url,
  access_token,
  body,
}: {
  url: string;
  access_token: string;
  body: object;
}): Promise<void> => {
  console.log({ url });
  const headers = {
    Accept: '*/*',
    Authorization: `Bearer ${access_token}`,
    'X-Country': 'ZM',
    'X-Currency': 'ZMW',
    'Content-Type': 'application/json',
  };
  console.log({ headers });
  console.log({ body });

  let responseData;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Failed to post transaction: ${response.status} ${response.statusText} - ${errorDetails}`,
      );
    }
    responseData = await response.json();
  } catch (error) {
    console.error(
      'Error posting transaction:',
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
  return responseData;
};
