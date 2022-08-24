import { IsNotEmpty, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultUserRole } from '../user-role.enum';

export class AssignAidworkerToProgramDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  public readonly userId: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  public readonly programId: number;

  @ApiProperty({
    example: Object.values(DefaultUserRole),
    enum: DefaultUserRole,
  })
  @IsArray()
  public readonly roles: DefaultUserRole[];
}
