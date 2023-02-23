import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteRegistrationDto {
  @ApiProperty({ example: '10d169fd-8da4-4acc-88fb-e1139bbbde6c' })
  @IsString()
  @IsNotEmpty()
  public readonly id: string;
}
