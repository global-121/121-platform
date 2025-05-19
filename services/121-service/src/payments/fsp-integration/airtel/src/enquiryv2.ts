import dotenv from 'dotenv';
dotenv.config();

import {
  createRequest,
  generateCurl,
  printRequest,
  printResponse,
  sendRequest,
} from '@121-service/src/payments/fsp-integration/airtel/src/util';
import { getAccessToken } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';

const API_BASE_URL = `${process.env.API_BASE_URL}`;
const CLIENT_ID = `${process.env.CLIENT_ID}`;
const CLIENT_SECRET = `${process.env.CLIENT_SECRET}`;

// Grab id from command line
const id = process.argv[2];
if (!id) {
  console.error('Please provide an id as a command line argument.');
  process.exit(1);
}

const access_token = await getAccessToken({
  url: `${API_BASE_URL}/auth/oauth2/token`,
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
});

const request = createRequest({
  method: 'GET',
  url: `${API_BASE_URL}/standard/v2/disbursements/${id}?transactionType=B2C`,
  access_token,
  body: null,
});

printRequest(request);

console.log(generateCurl(request));

const response = await sendRequest(request);

await printResponse(response);
