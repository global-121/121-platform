import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CreateApproverForThresholdDto {
  @ApiProperty({
    example: 2,
    description: 'Program aidworker assignment ID',
  })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public readonly programAidworkerAssignmentId: number;
}
