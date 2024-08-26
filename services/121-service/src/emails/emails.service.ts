import {
  CreateUserEmailPayload,
  GenericEmailPayload,
} from '@121-service/src/emails/dto/create-emails.dto';
import { EmailsApiService } from '@121-service/src/emails/emails.api.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailsService {
  public constructor(private readonly emailsApiService: EmailsApiService) {}

  public async sendCreateUserEmail(
    payload: CreateUserEmailPayload,
  ): Promise<void> {
    await this.emailsApiService.sendEmail(payload);
  }

  public async sendPasswordResetEmail(
    payload: CreateUserEmailPayload,
  ): Promise<void> {
    const subject = 'Your Password Reset Request';

    const body = `
      <title>121 Portal</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #F3F4F6; /* Light grey background */
          }
          .header, .footer {
              background-color: #0A2C5E; /* Dark blue background */
              color: #FFFFFF;
              padding: 20px;
              text-align: left;
          }
          .content {
              padding: 20px;
              margin: 20px;
              background-color: #FFFFFF; /* White background for content */
              border-radius: 8px; /* Rounded corners */
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Subtle shadow */
              margin-bottom: 40px; /* Increased bottom margin */
          }
      </style>

      <div>
          <p> Dear madam/sir, </p>

          <p>Your password for the 121 Portal has been reset. You can access the 121 portal <a href="${process.env.REDIRECT_PORTAL_URL_HOST}">here</a>.</p>
          <br>
          <p>Username: ${payload.username}</p>
          <p>New Password: ${payload.password}</p>
          <br>
          <p>Please change your password immediately after logging in here: ${process.env.REDIRECT_PORTAL_URL_HOST}user</p>

          <p>If you did not request this password reset, please contact support immediately.</p>

          <p>Kind regards,</p>

          <p>121 support</p>
      </div>
    `;

    await this.emailsApiService.sendEmail({
      email: payload.email,
      subject: subject,
      body: body,
    });
  }

  public async sendGenericEmail(payload: GenericEmailPayload): Promise<void> {
    await this.emailsApiService.sendEmail(payload);
  }
}
