import axios from 'axios';

// Function to trigger Safaricom Authentication API call
async function getAuthenticationToken(): Promise<string> {
  const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
  const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
  const accessTokenUrl = process.env.SAFARICOM_CONSUMER_ACCESS_TOKEN_URL;

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    const { data } = await axios.get(`${accessTokenUrl}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });
    console.log("Access Token: " + data.access_token);
    return data.access_token;
  } catch (error) {
    // Handle error appropriately
    throw new Error('Failed to retrieve access token from Safaricom Authentication API');
  }
}
