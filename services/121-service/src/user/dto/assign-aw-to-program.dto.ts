import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';
import { DefaultUserRole } from '../user-role.enum';

export class AssignAidworkerToProgramDto {
  @ApiProperty({
    example: Object.values(DefaultUserRole),
    enum: DefaultUserRole,
  })
  @IsArray()
  @ArrayMinSize(0)
  @IsOptional()
  public readonly roles: DefaultUserRole[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly scope: string;
}
