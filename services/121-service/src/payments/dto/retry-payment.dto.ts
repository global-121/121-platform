import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsNumber, IsOptional } from 'class-validator';

export class RetryPaymentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly paymentId: number;

  @ApiProperty({
    example: [
      '910c50be-f131-4b53-b06b-6506a40a2734',
      '910c50be-f131-4b53-b06b-6506a40a2735',
    ],
  })
  @IsOptional()
  @ArrayMaxSize(100000) // Arbitrary large number to prevent abuse
  @IsArray()
  public readonly referenceIds?: string[]; // In the frontend we always send the referenceIds so we can consider making this required
}
