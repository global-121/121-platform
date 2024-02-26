import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, Length } from 'class-validator';
import { FspName } from '../../fsp/enum/fsp-name.enum';

export class SetFspDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(5, 200)
  public readonly referenceId: string;
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly fspId: number;
}

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
