import { ApiProperty } from '@nestjs/swagger';

export class CreateVisaCardOrderResponseDto {
  @ApiProperty({ example: 100 })
  public readonly noOfCardsSent: number;

  @ApiProperty({ example: 100 })
  public readonly noOfCardsOrdered: number;
}
