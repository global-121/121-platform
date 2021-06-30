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

class AccountSidObject {
  public readonly accountSid: string;
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

export class TwilioStatusCallbackDto {
  @ApiModelProperty({ example: 'SMb677b6846ec347cf80b8a5fd948efb53' })
  @IsString()
  public readonly MessageSid: string;
  @ApiModelProperty({ example: 'delivered' })
  @IsString()
  public readonly MessageStatus: string;
  @ApiModelProperty({ example: 'Twilio Error: []' })
  @IsString()
  @IsOptional()
  public readonly ErrorMessage: string;
  @ApiModelProperty({ example: '63015' })
  @IsString()
  @IsOptional()
  public readonly ErrorCode: string;
}
