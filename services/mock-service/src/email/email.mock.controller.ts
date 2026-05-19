import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SendMailRequestDto } from '@mock-service/src/email/dto/send-mail-request.dto';
import { EmailMockService } from '@mock-service/src/email/email.mock.service';

@ApiTags('email')
@Controller('email')
export class EmailMockController {
  public constructor(private readonly emailMockService: EmailMockService) {}

  @ApiOperation({
    summary:
      'Send an email (mock of Microsoft Graph `POST /users/{sender}/sendMail`)',
  })
  @ApiParam({
    name: 'sender',
    example: 'no-reply@example.org',
    description: 'Sender mailbox / UPN. Mirrors the real Graph API route.',
  })
  @Post('users/:sender/sendMail')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description:
      'Email accepted for delivery. No response body (matches Graph API).',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid input — e.g. malformatted email address, empty subject or body.',
  })
  public sendMail(
    @Param('sender') sender: string,
    @Body() body: SendMailRequestDto,
  ): void {
    this.emailMockService.sendMail({ sender, request: body });
  }
}

