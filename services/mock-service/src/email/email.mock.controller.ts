import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SendEmailRequestDto } from '@mock-service/src/email/dto/send-email-request.dto';
import { SendEmailResponseDto } from '@mock-service/src/email/dto/send-email-response.dto';
import { EmailMockService } from '@mock-service/src/email/email.mock.service';

@ApiTags('email')
@Controller('email')
export class EmailMockController {
  public constructor(private readonly emailMockService: EmailMockService) {}

  @ApiOperation({ summary: 'Send an email (mock)' })
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email accepted for delivery.',
    type: SendEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid input — e.g. malformatted email address, empty subject or body.',
  })
  public sendEmail(@Body() body: SendEmailRequestDto): SendEmailResponseDto {
    return this.emailMockService.sendEmail(body);
  }
}
