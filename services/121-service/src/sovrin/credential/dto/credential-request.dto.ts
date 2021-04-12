import { Length, IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class CredentialRequestDto {
  @ApiModelProperty({ example: 'did:sov:exampleExampleExample' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  public readonly programId: number;
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  public readonly encryptedCredentialRequest: string;
}
