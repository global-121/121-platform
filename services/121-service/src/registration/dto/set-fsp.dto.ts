import { Length, IsNumber, IsIn, IsOptional } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { fspName } from '../../fsp/financial-service-provider.entity';

export class SetFspDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly fspId: number;
}

const fspArray = Object.values(fspName).map(item => String(item));

export class UpdateChosenFspDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({
    enum: fspArray,
    example: fspArray.join(' | '),
  })
  @IsIn(fspArray)
  public readonly newFspName: fspName;
  @ApiModelProperty({
    example: {
      whatsappPhoneNumber: '31600000000',
    },
  })
  @IsOptional()
  public readonly newFspAttributes: JSON;
}
