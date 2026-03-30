import { Injectable } from '@nestjs/common';

import { SendEmailRequestDto } from '@mock-service/src/email/dto/send-email-request.dto';
import { SendEmailResponseDto } from '@mock-service/src/email/dto/send-email-response.dto';

@Injectable()
export class EmailMockService {
  public sendEmail(_body: SendEmailRequestDto): SendEmailResponseDto {
    return { message: 'Email accepted' };
  }
}
