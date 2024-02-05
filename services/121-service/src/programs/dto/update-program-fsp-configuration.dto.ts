import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { FspConfigurationEnum } from '../../fsp/enum/fsp-name.enum';

export class UpdateProgramFspConfigurationDto {
  @ApiProperty({ example: FspConfigurationEnum.username })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'test_account' })
  @IsNotEmpty()
  @IsString()
  value: string;
}
