import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class MessageTemplateDto {
  @ApiProperty()
  @IsNumber()
  public readonly programId: number;
  @ApiProperty()
  @IsString()
  public readonly type: string;
  @ApiProperty()
  @IsString()
  public readonly language: string;
  @ApiProperty()
  @IsString()
  public readonly message: string;
  @ApiProperty()
  @IsBoolean()
  public readonly isWhatsappTemplate: boolean;
}
