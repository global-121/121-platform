import { Buffer } from 'node:buffer';
import { publicEncrypt } from 'node:crypto';
const { constants } = await import('node:crypto');

const rsaPublicKeyToPem = (key: string): string => {
  const formattedKey = `-----BEGIN PUBLIC KEY-----\n${key
    .match(/.{1,64}/g)
    ?.join('\n')}\n-----END PUBLIC KEY-----`;
  return formattedKey;
};

export const encryptPinV1 = (data: string, base64PublicKey: string): string => {
  const publicKey = rsaPublicKeyToPem(base64PublicKey);
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
      console.log(response);
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

const printSeparator = (char = '-', length = 20): void => {
  const separator = char.repeat(length);
  console.log(separator);
};

export const createRequest = ({
  method = 'GET',
  url,
  access_token,
  body = null,
}: {
  method?: string;
  url: string;
  access_token: string;
  body: object | null;
}) => {
  const headers = {
    Accept: '*/*',
    Authorization: `Bearer ${access_token}`,
    'X-Country': 'ZM',
    'X-Currency': 'ZMW',
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  return {
    method,
    url,
    headers,
    body,
  };
};

export const printRequest = ({ method, url, headers, body }) => {
  printSeparator();
  console.log('Request:');
  console.log(`Method: ${method}`);
  console.log(`URL: ${url}`);
  console.log('Headers:', headers);
  if (body) {
    console.log('Body:', body);
  }
  printSeparator();
};

export const printResponse = async (response) => {
  printSeparator();
  console.log('Response:');
  console.log('Status:', response.status);
  // console.log('Headers:', response.headers);
  console.log('Body: ', await response.json());
  printSeparator();
};

export const generateCurl = ({ url, method, headers, body }: any): string => {
  let curlCommand = `curl -X ${method} "${url}"`;
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      curlCommand += ` -H "${key}: ${value}"`;
    });
  }
  if (body) {
    curlCommand += ` -d '${JSON.stringify(body)}'`;
  }
  return curlCommand;
};

export const sendRequest = async ({
  method,
  url,
  headers,
  body,
}: {
  method: string;
  url: string;
  headers: object | null;
  body: object;
}): Promise<Response> => {
  let response;
  const options: Record<string, any> = {
    method,
  };

  if (headers) {
    options.headers = headers;
  }
  if (body) {
    options.body = JSON.stringify(body);
  }
  try {
    response = await fetch(url, options);

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Got an error: ${response.status} ${response.statusText} - ${errorDetails}`,
      );
    }
  } catch (error) {
    console.error('Error :', error instanceof Error ? error.message : error);
    throw error;
  }
  return response;
};
