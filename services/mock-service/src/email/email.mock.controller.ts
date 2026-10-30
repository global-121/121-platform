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

import { DeleteSentEmailsQueryDto } from '@mock-service/src/email/dto/delete-sent-emails-query.dto';
import { GetSentEmailResponseDto } from '@mock-service/src/email/dto/get-sent-email-response.dto';
import { GetSentEmailsQueryDto } from '@mock-service/src/email/dto/get-sent-emails-query.dto';
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
  public getSentEmails(
    @Query() query: GetSentEmailsQueryDto,
  ): GetSentEmailResponseDto[] {
    return this.emailMockService.getSentEmails({ recipient: query.recipient });
  }

  @ApiOperation({
    summary:
      'Delete the sent emails of a recipient, or of all recipients (test-only, not part of the Graph API)',
  })
  @Delete('messages')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Sent emails deleted.',
  })
  public deleteSentEmails(@Query() query: DeleteSentEmailsQueryDto): void {
    this.emailMockService.deleteSentEmails({ recipient: query.recipient });
  }
}
