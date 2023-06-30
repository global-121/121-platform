import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class SafaricomPaymentStatusDto {
  @ApiProperty({ example: 'tatev' })
  @IsString()
  public readonly initiatorName: string;

  @ApiProperty({
    example:
      'dyz9S+q13ogJ+XqRBK8zH6VoXk6dFPeAfGgfrVTo3Nk2rrtsoZGqJMN4I2dcBlqI1yAOyhKsL8I44gEwxXE7QoE50MKSPfgbCEgpZk2CWUtqjn2fbx4votSnaCCelYOt84cw0pAauqmN1ooho4YM5yS5sCxTBMDnDTRIkJSu5Pe8ncIezmX3qJWf11otPYnIb1glUD9XobP+dhrwvTiUlFV/DOJh6TCFq6yk/9Em9amum63nsMWVp6JnsZUG8V+BmPhueY/txBh4O+4LT99z8kQITGTasXxcWMbgQ0Upj+EadKm7Lvvfw24Bqw+ClUoVvzvSqke9fTVg5MYrkjpL9A==',
  })
  @IsString()
  public readonly securityCredential: string;

  @ApiProperty({ example: 'BusinessPayment' })
  @IsString()
  public readonly commandID: string;

  @ApiProperty({ example: 2050 })
  @IsNumber()
  public readonly amount: number;

  @ApiProperty({ example: '9990013' })
  @IsString()
  public readonly partyA: string;

  @ApiProperty({ example: '254728762287' })
  @IsString()
  public readonly partyB: string;

  @ApiProperty({ example: 'here are my remarks' })
  @IsString()
  public readonly remarks: string;

  @ApiProperty({ example: 'https://darajambili.herokuapp.com/b2c/timeout' })
  @IsString()
  public readonly queueTimeOutURL: string;

  @ApiProperty({ example: 'https://darajambili.herokuapp.com/b2c/result' })
  @IsString()
  public readonly resultURL: string;

  @ApiProperty({ example: 'Christmas' })
  @IsString()
  @IsOptional()
  public readonly occassion: string;

  @ApiProperty({ example: 'AUTHORIZING' })
  @IsString()
  public readonly status?: string;

  public readonly requestResult?: JSON;

  public readonly paymentResult?: JSON;
}
