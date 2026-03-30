import { ApiProperty } from '@nestjs/swagger';

export class SendEmailResponseDto {
  @ApiProperty({ example: 'Email accepted' })
  public readonly message: string;
}
