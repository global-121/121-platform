// const { webcrypto } = await import('node:crypto');
const { generateKeyPair } = await import('node:crypto');
const { constants } = await import('node:crypto');
import { Buffer } from 'node:buffer';
import { createCipheriv } from 'node:crypto';
import { publicEncrypt } from 'node:crypto';
import { privateDecrypt } from 'node:crypto';
import { getRandomValues } from 'node:crypto';

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

export const generateRandomBytes = (length: number): Buffer => {
  const array = new Uint8Array(length);
  getRandomValues(array);
  return Buffer.from(array);
};

export const base64ToBuffer = (base64: string): Buffer => {
  return Buffer.from(base64, 'base64');
};

export const rsaKeyToPem = (key: string): string => {
  const formattedKey = `-----BEGIN PUBLIC KEY-----\n${key
    .match(/.{1,64}/g)
    ?.join('\n')}\n-----END PUBLIC KEY-----`;
  return formattedKey;
};

export const generateRsaKeyPair = async (): Promise<{
  publicKey: string;
  privateKey: string;
}> => {
  return new Promise((resolve, reject) => {
    generateKeyPair(
      'rsa',
      {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      },
      (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
        } else {
          resolve({ publicKey, privateKey });
        }
      },
    );
  });
};

export const encryptRsaKeyIv = (data: string, publicKeyPem: string): string => {
  const bufferData = Buffer.from(data, 'utf8');
  // console.log(publicKeyPem, bufferData);
  const encrypted = publicEncrypt(publicKeyPem, bufferData);
  return encrypted.toString('base64');
};

export const encryptRsa = encryptRsaKeyIv;

export const encryptRsaPin = (data: string, publicKeyPem: string): string => {
  const bufferData = Buffer.from(data, 'utf8');
  // console.log(publicKeyPem, bufferData);
  const encrypted = publicEncrypt(
    {
      key: publicKeyPem,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    bufferData,
  );
  return encrypted.toString('base64');
};

//
//

export const decryptRsa = (
  ciphertext: string,
  privateKeyPem: string,
): string => {
  const bufferCiphertext = Buffer.from(ciphertext, 'base64');
  const decrypted = privateDecrypt(privateKeyPem, bufferCiphertext);
  return decrypted.toString('utf8');
};

export const encryptAes = (
  payload: object,
  key: Buffer,
  iv: Buffer,
): string => {
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

export const getAccessToken = async (): Promise<string> => {
  const url = `${process.env.API_BASE_URL}/auth/oauth2/token`;
  // console.log("URL:", url);
  const headers = {
    'Content-Type': 'application/json',
    Accept: '*/*',
  };

  const body = JSON.stringify({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  // console.log("Request Body:", body);

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
    // console.log("Access Token Response:", { access_token });
    return access_token;
  } catch (error) {
    console.error(
      'Error fetching access token:',
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};

export const getRsaKey = async (accessToken: string): Promise<string> => {
  const url = `${process.env.API_BASE_URL}/v1/rsa/encryption-keys`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'X-Country': 'UG',
    'X-Currency': 'UGX',
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Failed to fetch RSA key: ${response.status} ${response.statusText} - ${errorDetails}`,
      );
    }

    const { data } = (await response.json()) as { data: { key: string } };

    return rsaKeyToPem(data.key);
  } catch (error) {
    console.error(
      'Error fetching RSA key:',
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};

export const postTransaction = async (
  accessToken: string,
  xSignature: string,
  xKey: string,
  body: object,
): Promise<void> => {
  const url = `${process.env.API_BASE_URL}/standard/v3/disbursements`;
  console.log({ url });
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'X-Country': 'ZM',
    'X-Currency': 'ZMW',
    'x-signature': xSignature,
    'x-key': xKey,
    'Content-Type': 'application/json',
  };
  console.log({ headers });

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

    const responseData = await response.json();
    console.log('Transaction Response:', responseData);
  } catch (error) {
    console.error(
      'Error posting transaction:',
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};
