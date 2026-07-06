import { ApiProperty } from '@nestjs/swagger';

export class CreateVisaCardOrderResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: 100 })
  public readonly noOfCards: number;
}
