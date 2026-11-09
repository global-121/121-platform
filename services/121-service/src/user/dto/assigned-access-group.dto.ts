import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignedAccessGroupDto {
  @ApiProperty({ example: 'county' })
  @IsString()
  public readonly programRegistrationAttributeName: string;

  @ApiProperty({ example: 'kisumu' })
  @IsString()
  public readonly value: string;
}
