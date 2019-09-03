import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class InculdeMeDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
  @IsNotEmpty()
  @IsNumber()
  @ApiModelProperty({ example: 1 })
  public readonly programId: number;
  @ApiModelProperty({ example: 'superEncrypted' })
  @IsNotEmpty()
  @IsString()
  public readonly encryptedProof: string;
}
