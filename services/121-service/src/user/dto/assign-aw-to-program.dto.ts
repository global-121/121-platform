import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

export class CreateProgramAssignmentDto {
  @ApiProperty({
    example: Object.values(DefaultUserRole),
    enum: DefaultUserRole,
  })
  @IsArray()
  @ArrayMinSize(0)
  public readonly roles: DefaultUserRole[];

  @ApiProperty()
  @IsString()
  public readonly scope: string;
}

export class UpdateProgramAssignmentDto {
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
  public readonly rolesToDelete?: DefaultUserRole[];
}
