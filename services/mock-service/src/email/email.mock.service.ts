import { Injectable, Logger } from '@nestjs/common';

import { SendEmailRequestDto } from '@mock-service/src/email/dto/send-email-request.dto';
import { SendEmailResponseDto } from '@mock-service/src/email/dto/send-email-response.dto';

@Injectable()
export class EmailMockService {
  private readonly logger = new Logger(EmailMockService.name);

  public sendEmail(body: SendEmailRequestDto): SendEmailResponseDto {
    this.logger.log(
      `Mock email sent to="${body.email}" subject="${body.subject}"`,
    );
    return { message: 'Email accepted' };
  }
}
