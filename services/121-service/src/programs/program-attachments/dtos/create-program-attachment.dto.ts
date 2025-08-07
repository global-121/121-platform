import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProgramAttachmentDto {
  @ApiProperty({ example: 'MyDocument' })
  @IsString()
  @IsNotEmpty()
  public readonly filename: string;
}
