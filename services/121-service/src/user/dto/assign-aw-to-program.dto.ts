import { IsNotEmpty, IsArray, IsNumber, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DefaultUserRole } from '../user-role.enum';

export class AssignAidworkerToProgramDto {
  @ApiProperty({
    example: Object.values(DefaultUserRole),
    enum: DefaultUserRole,
  })
  @IsArray()
  @ArrayMinSize(1)
  public readonly roles: DefaultUserRole[];
}
