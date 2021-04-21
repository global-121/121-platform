import {
  Length,
  IsString,
  ValidateIf,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class SetPhoneRequestDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({ example: '31600000000' })
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
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({ example: '31600000000' })
  @ValidateIf(o => o.phonenumber)
  @IsString()
  public readonly phonenumber: string;
}
