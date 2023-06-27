import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SafaricomPaymentStatusDto {
  safaricomRequestId?: number;

  @ApiProperty({ example: 'tatev' })
  @IsString()
  public readonly InitiatorName: string;

  @ApiProperty({
    example:
      'dyz9S+q13ogJ+XqRBK8zH6VoXk6dFPeAfGgfrVTo3Nk2rrtsoZGqJMN4I2dcBlqI1yAOyhKsL8I44gEwxXE7QoE50MKSPfgbCEgpZk2CWUtqjn2fbx4votSnaCCelYOt84cw0pAauqmN1ooho4YM5yS5sCxTBMDnDTRIkJSu5Pe8ncIezmX3qJWf11otPYnIb1glUD9XobP+dhrwvTiUlFV/DOJh6TCFq6yk/9Em9amum63nsMWVp6JnsZUG8V+BmPhueY/txBh4O+4LT99z8kQITGTasXxcWMbgQ0Upj+EadKm7Lvvfw24Bqw+ClUoVvzvSqke9fTVg5MYrkjpL9A==',
  })
  @IsString()
  public readonly SecurityCredential: string;

  @ApiProperty({ example: 'BusinessPayment' })
  @IsString()
  public readonly CommandID: string;

  @ApiProperty({ example: 2050 })
  @IsNumber()
  public readonly Amount: number;

  @ApiProperty({ example: '9990013' })
  @IsString()
  public readonly PartyA: string;

  @ApiProperty({ example: '254728762287' })
  @IsString()
  public readonly PartyB: string;

  @ApiProperty({ example: 'here are my remarks' })
  @IsString()
  public readonly Remarks: string;

  @ApiProperty({ example: 'https://darajambili.herokuapp.com/b2c/timeout' })
  @IsString()
  public readonly QueueTimeOutURL: string;

  @ApiProperty({ example: 'https://darajambili.herokuapp.com/b2c/result' })
  @IsString()
  public readonly ResultURL: string;

  @ApiProperty({ example: 'Christmas' })
  @IsString()
  @IsOptional()
  public readonly Occassion: string;

  @ApiProperty({ example: 'AUTHORIZING' })
  @IsString()
  public readonly Status: string;
}
