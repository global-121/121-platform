import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateProgramFspConfigurationDto {
  @ApiProperty({ example: 'username' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'test_account' })
  @IsNotEmpty()
  @IsString()
  value: string;
}
