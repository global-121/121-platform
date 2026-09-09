import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateActivityInfoDto {
  @ApiProperty({
    example: 'cqlnfvvmel72a2ka',
    description:
      "The ActivityInfo form id (CUID). In the Portal this is parsed from a form URL such as 'https://www.activityinfo.org/app#form/cqlnfvvmel72a2ka/table'.",
  })
  @IsNotEmpty()
  @IsString()
  public readonly formId: string;

  @ApiProperty({
    example: 'your-activityinfo-personal-api-token-here',
    description:
      'An ActivityInfo personal API token, sent to ActivityInfo as a bearer token.',
  })
  @IsNotEmpty()
  @IsString()
  public readonly token: string;

  @ApiProperty({
    example: 'https://www.activityinfo.org',
    description: 'Base URL of the ActivityInfo server.',
  })
  @IsNotEmpty()
  @IsString()
  public readonly url: string;
}
