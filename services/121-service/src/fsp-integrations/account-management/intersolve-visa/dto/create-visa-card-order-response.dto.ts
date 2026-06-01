import { ApiProperty } from '@nestjs/swagger';

export class CreateVisaCardOrderResponseDto {
  @ApiProperty({ example: 100 })
  public readonly noOfCards: number;

  @ApiProperty({ example: 100 })
  public readonly noOfCardsOrdered: number;
}
