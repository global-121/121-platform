import { ApiProperty } from '@nestjs/swagger';

class AirtelUserLookupResponseDataDto {
  @ApiProperty({ example: 'John Doe' })
  public user_name: string;

  @ApiProperty({ example: '971234567' })
  public msisdn: string;

  @ApiProperty({ example: true })
  public is_airtel_money_user: boolean;
}

class AirtelUserLookupResponseStatusDto {
  @ApiProperty({ example: 'DP00800001000' })
  public response_code: string;

  @ApiProperty({ example: '200' })
  public code: string;

  @ApiProperty({ example: true })
  public success: boolean;

  @ApiProperty({ example: 'Success' })
  public message: string;
}

export class AirtelUserLookupResponseDto {
  @ApiProperty()
  public data: AirtelUserLookupResponseDataDto;

  @ApiProperty()
  public status: AirtelUserLookupResponseStatusDto;
}
