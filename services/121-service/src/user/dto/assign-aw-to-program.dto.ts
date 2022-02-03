import { IsNotEmpty, IsArray, IsNumber } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { DefaultUserRole } from '../user-role.enum';

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
    example: Object.values(DefaultUserRole),
    enum: DefaultUserRole,
  })
  @IsArray()
  public readonly roles: DefaultUserRole[];
}
