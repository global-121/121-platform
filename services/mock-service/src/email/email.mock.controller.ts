import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetSentEmailResponseDto } from '@mock-service/src/email/dto/get-sent-email-response.dto';
import { SendMailRequestDto } from '@mock-service/src/email/dto/send-mail-request.dto';
import { SentEmailsQueryDto } from '@mock-service/src/email/dto/sent-emails-query.dto';
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

  @ApiOperation({
    summary:
      'Get the emails sent to a recipient, newest first (test-only, not part of the Graph API)',
  })
  @Get('messages')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [GetSentEmailResponseDto],
    description: 'The emails sent to the recipient. Empty if there are none.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input: `recipient` is not an email address.',
  })
  public getSentEmails(
    @Query() query: SentEmailsQueryDto,
  ): GetSentEmailResponseDto[] {
    return this.emailMockService.getSentEmails({ recipient: query.recipient });
  }

  @ApiOperation({
    summary:
      'Delete the sent emails of a recipient (test-only, not part of the Graph API)',
  })
  @Delete('messages')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Sent emails deleted.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input: `recipient` is not an email address.',
  })
  public deleteSentEmails(@Query() query: SentEmailsQueryDto): void {
    this.emailMockService.deleteSentEmails({ recipient: query.recipient });
  }
}
