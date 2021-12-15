import { IsNotEmpty, IsArray, IsNumber } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { UserRole } from '../../user-role.enum';

export class AssignAidworkerToProgramDto {
  @ApiModelProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  public readonly userId: number;

  @ApiModelProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  public readonly programId: number;

  @ApiModelProperty({
    example: Object.values(UserRole),
    enum: UserRole,
  })
  @IsArray()
  public readonly roles: UserRole[];
}
