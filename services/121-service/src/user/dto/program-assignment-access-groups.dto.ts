import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateIf, ValidateNested } from 'class-validator';

import { AssignedAccessGroupDto } from '@121-service/src/user/dto/assigned-access-group.dto';

export abstract class ProgramAssignmentAccessGroupsDto {
  @ApiProperty({
    type: [AssignedAccessGroupDto],
    required: false,
    description:
      'Omit to leave the existing access groups unchanged. Send an empty array to remove all access groups. ' +
      "Each access group is a level configured for the program with one of the level's options as value. " +
      'Start at the highest level and do not skip levels. ' +
      'Not allowed for users that are an approver for the program.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignedAccessGroupDto)
  public readonly accessGroups?: AssignedAccessGroupDto[];
}
