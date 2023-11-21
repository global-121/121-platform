import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class MessageTemplateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly type: string;
  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly language: string;
  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly message: string;
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  public readonly isWhatsappTemplate: boolean;
}
