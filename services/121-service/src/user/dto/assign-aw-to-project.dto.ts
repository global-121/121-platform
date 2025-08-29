import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

import { DefaultUserRole } from '@121-service/src/user/user-role.enum';

export class CreateProjectAssignmentDto {
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

export class UpdateProjectAssignmentDto {
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

export class DeleteProjectAssignmentDto {
  @ApiProperty({
    example: Object.values(DefaultUserRole),
    enum: DefaultUserRole,
  })
  @IsArray()
  @ArrayMinSize(0)
  @IsOptional()
  public readonly rolesToDelete?: DefaultUserRole[] | string[];
}
