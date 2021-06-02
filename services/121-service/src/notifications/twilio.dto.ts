import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TwilioMessagesCreateDto {
  @ApiModelProperty()
  @IsString()
  public readonly body: string;

  @ApiModelProperty()
  @IsString()
  public readonly messagingServiceSid: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  public readonly from: string;

  @ApiModelProperty()
  @IsString()
  public readonly statusCallback: string;

  @ApiModelProperty()
  @IsString()
  public readonly to: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  public readonly mediaUrl: string;
}

export class TwilioCallsCreateDto {
  @ApiModelProperty()
  @IsString()
  public readonly method: string;

  @ApiModelProperty()
  @IsString()
  public readonly url: string;

  @ApiModelProperty()
  @IsString()
  public readonly to: string;

  @ApiModelProperty()
  @IsString()
  public readonly statusCallback: string;

  @ApiModelProperty()
  @IsString()
  public readonly from: string;
}

export class TwilioValidateRequestDto {
  @ApiModelProperty()
  @IsString()
  public readonly authToken: string;

  @ApiModelProperty()
  @IsString()
  public readonly signature: string;

  @ApiModelProperty()
  @IsString()
  public readonly callbackUrl: string;

  @ApiModelProperty()
  @IsString()
  public readonly body: string;

  @ApiModelProperty()
  @IsString()
  @IsOptional()
  public readonly accountSidObject: AccountSidObject;
}

class AccountSidObject {
  public readonly accountSid: string;
}
