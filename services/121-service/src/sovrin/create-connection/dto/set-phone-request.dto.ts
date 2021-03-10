import {
  Length,
  IsString,
  ValidateIf,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class SetPhoneRequestDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: '0031600000000' })
  @ValidateIf(o => o.phonenumber)
  @IsString()
  public readonly phonenumber: string;
  @ValidateIf(o => o.language)
  @ApiModelProperty({ example: 'en' })
  @IsString()
  @Length(2, 8)
  public readonly language: string;
  @ApiModelProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  public readonly useForInvitationMatching: boolean;
}

export class UpdatePhoneRequestDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
  @ApiModelProperty({ example: '0031600000000' })
  @ValidateIf(o => o.phonenumber)
  @IsString()
  public readonly phonenumber: string;
}
