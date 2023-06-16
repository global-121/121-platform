// export class SafaricomTransferPayload {
//   public InitiatorName: string;
//   public SecurityCredential: string;
//   public CommandID: string;
//   public Amount: number;
//   public PartyA: string;
//   public PartyB: string;
//   public Remarks: string;
//   public QueueTimeOutURL: string;
//   public ResultURL: string;
//   public Occassion: string;
// }

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SafaricomTransferPayloadDto {
  @ApiProperty({ example: 'tatev' })
  @IsString()
  public readonly InitiatorName: string;

  @ApiProperty({ example: '"oH0z5/vcJC/DkdV2HlUZQ79biDgGCNua5gV0jI7oOFV0aocgIH21fSdtVku/ypqKh1zLtBcCbJ0L4JRq2Y+wLBV/7Rh8xAnsy0Ly/GzkM7ZpFxrNoCvivIm5UgH7TJcTLqKQPk+X0DJWts7bVbnwzUlu7UCh1a/Ifs4p4QlVLr9m/gBePy97rhcsjZCZGPPLEY9pscRPaNI3WVQp6Yks3Epsf314Q0Ym8qW6JAzT+9VhppMYvIYJpcFwFtRKKWSmllqdHG1mBcq7mTAo7mE53mCqS9U8E4/uqQZJepBj5RQCOwkazO8AtJ6BiOCHushrYQsbTquyhd2oo7MHoZ+lTw=="' })
  @IsString()
  public readonly SecurityCredential: string;

  @ApiProperty({ example: 'BusinessPayment' })
  @IsString()
  public readonly CommandID: string;

  @ApiProperty({ example: 20.50 })
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
}