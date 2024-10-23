/**
 * Wrap the email content in a base-template.
 * @param content HTML-content of the email; Output within a white box, between header and footer
 */
export const emailBody = (content: string): string => {
  const portalName = '121 Portal';
  const supportEmail = 'support@121.global';

  const body = `
    <style>
    html,
    body {
      margin: 0;
      padding: 0;
      font-family: Open Sans, ui-sans-serif, system-ui, sans-serif;
    }
    .header,
    .footer {
      padding: 1.2em;
      color: #fff;
      background-color: #0A2C5E;
    }
    .content {
      padding: 1.2em;
      margin: 1.2em;
      margin-bottom: 2em;
      color: #000;
      background-color: #fff;
      border-radius: 0.5em;
      box-shadow: 0 0 0.75em rgba(0, 0, 0, 0.1);
    }
    </style>

    <div class="header">
      <h1>${portalName}</h1>
    </div>

    <div class="content">
      ${content}
    </div>

    <div class="footer">
      121 Support: <a href="mailto:${supportEmail}" style="color:#fff">${supportEmail}</a>
    </div>
  `;

  return body;
};
