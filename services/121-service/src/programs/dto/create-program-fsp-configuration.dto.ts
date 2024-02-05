import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { FspConfigurationEnum } from '../../fsp/enum/fsp-name.enum';

export class CreateProgramFspConfigurationDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  fspId: number;

  @ApiProperty({ example: FspConfigurationEnum.username })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'test_account' })
  @IsNotEmpty()
  @IsString()
  value: string;
}
