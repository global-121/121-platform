import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, Length } from 'class-validator';
import { FspName } from '../../fsp/financial-service-provider.entity';

export class SetFspDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly fspId: number;
}

const fspArray = Object.values(FspName).map(item => String(item));

export class UpdateChosenFspDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
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
