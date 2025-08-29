import { ApiProperty } from '@nestjs/swagger';

export class DuplicateReponseDto {
  @ApiProperty({ example: 'Juan Garcia' })
  public readonly name?: string;

  @ApiProperty({ example: 1 })
  public readonly registrationId: number;

  @ApiProperty({ example: 1 })
  public readonly registrationProjectId: number;

  @ApiProperty({ example: 'zeeland' })
  public readonly scope: string;

  @ApiProperty({ example: ['phoneNumber'] })
  public readonly attributeNames: string[];

  @ApiProperty({ example: true })
  public readonly isInScope: boolean;
}
