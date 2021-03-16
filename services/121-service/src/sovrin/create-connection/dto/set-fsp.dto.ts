import { Length, IsNumber, IsIn, IsOptional } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { fspName } from '../../../programs/fsp/financial-service-provider.entity';

export class SetFspDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly fspId: number;
}

const fspArray = Object.values(fspName).map(item => String(item));

export class UpdateChosenFspDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
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
