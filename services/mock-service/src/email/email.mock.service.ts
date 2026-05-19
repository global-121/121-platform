import { Injectable } from '@nestjs/common';

import { SendMailRequestDto } from '@mock-service/src/email/dto/send-mail-request.dto';

@Injectable()
export class EmailMockService {
  public sendMail({
     sender: _sender,
     request: _request,
  }: {
    sender: string;
    request: SendMailRequestDto;
  }): void {
    // Mock implementation: accept and discard. Matches the real Microsoft
    // Graph `sendMail` endpoint, which returns 202 Accepted with no body.
  }
}
