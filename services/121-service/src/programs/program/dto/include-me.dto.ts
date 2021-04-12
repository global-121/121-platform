import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class IncludeMeDto {
  @ApiModelProperty({ example: 'did:sov:exampleExampleExample' })
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
