import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateProgramApprovalThresholdDto {
  @ApiProperty({ example: 1000, description: 'Threshold amount for approval' })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  public readonly thresholdAmount?: number;

  @ApiProperty({ example: 1, description: 'Approval level' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  public readonly approvalLevel?: number;
}
