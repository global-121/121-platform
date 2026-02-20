import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateProgramApprovalThresholdDto {
  @ApiProperty({ example: 1000, description: 'Threshold amount for approval' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  public readonly thresholdAmount: number;

  @ApiProperty({ example: 1, description: 'Approval level' })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public readonly approvalLevel: number;

  @ApiProperty({ example: 1, description: 'Program ID' })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public readonly programId: number;
}
