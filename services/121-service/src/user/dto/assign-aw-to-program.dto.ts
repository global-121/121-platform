import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

import { ProgramAssignmentAccessGroupsDto } from '@121-service/src/user/dto/program-assignment-access-groups.dto';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';

export class CreateProgramAssignmentDto extends ProgramAssignmentAccessGroupsDto {
  @ApiProperty({
    example: Object.values(DefaultUserRole),
    enum: DefaultUserRole,
  })
  @IsArray()
  @ArrayMinSize(0)
  public readonly roles: DefaultUserRole[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly scope?: string;
}

export class UpdateProgramAssignmentDto extends ProgramAssignmentAccessGroupsDto {
  @ApiProperty({
    example: Object.values(DefaultUserRole),
    enum: DefaultUserRole,
  })
  @IsArray()
  @ArrayMinSize(0)
  @IsOptional()
  public readonly rolesToAdd?: DefaultUserRole[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly scope?: string;
}

export class DeleteProgramAssignmentDto {
  @ApiProperty({
    example: Object.values(DefaultUserRole),
    enum: DefaultUserRole,
  })
  @IsArray()
  @ArrayMinSize(0)
  @IsOptional()
  public readonly rolesToDelete?: DefaultUserRole[] | string[];
}
