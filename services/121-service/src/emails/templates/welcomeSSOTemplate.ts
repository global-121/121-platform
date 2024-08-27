export const createSSOUserTemplate = (
  username: string,
): { subject: string; body: string } => {
  const subject = 'Your 121 Portal Account has been Created';

  const body = `
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #F3F4F6;
        }
        .header, .footer {
            background-color: #0A2C5E;
            color: #FFFFFF;
            padding: 20px;
            text-align: left;
        }
        .content {
            padding: 20px;
            margin: 20px;
            background-color: #FFFFFF;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 40px;
        }
    </style>

    <div class="content">
      <p>Dear madam/sir,</p>
      <p>A 121 account has been created for you. You can access the 121 portal <a href="${process.env.REDIRECT_PORTAL_URL_HOST}">here</a>.</p>
      <br>
      <p>Log in with your account: <strong>${username}</strong></p>
      <p>Kind regards,</p>
      <p>121 support</p>
    </div>

    <div class="footer">
      &copy; 2024 121 Support, All rights reserved.
    </div>
  `;

  return { subject, body };
};
