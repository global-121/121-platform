import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { FspName } from '../../fsp/enum/fsp-name.enum';

const fspArray = Object.values(FspName).map((item) => String(item));

export class UpdateChosenFspDto {
  @ApiProperty({
    enum: fspArray,
    example: fspArray.join(' | '),
  })
  @IsIn(fspArray)
  public readonly newFspName: FspName;
  @ApiProperty({
    example: {
      whatsappPhoneNumber: '31600000000',
    },
  })
  @IsOptional()
  public readonly newFspAttributes: JSON;
}
