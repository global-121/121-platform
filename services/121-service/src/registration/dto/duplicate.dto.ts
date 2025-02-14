import { ApiProperty } from '@nestjs/swagger';

// TODO: Discuss should this be name DuplicateReponseDto? (as in the guidelines) And that the api returns DuplicateReponseDto[]?
// or should we have DuplicateDto and DuplicateResponseDto? With the latter being the response from the api which equals DuplicateDto[]
export class DuplicateDto {
  @ApiProperty({ example: 'Juan Garcia' })
  public readonly name?: string;

  @ApiProperty({ example: 1 })
  public readonly registrationId: number;

  @ApiProperty({ example: 1 })
  public readonly registrationProgramId: number;

  @ApiProperty({ example: 'zeeland' })
  public readonly scope: string;

  @ApiProperty({ example: ['phoneNumber'] })
  public readonly attributeNames: string[];

  @ApiProperty({ example: true })
  public readonly isDuplicateAccessibleWithinScope: boolean;
}
