import { ApiModelProperty } from '@nestjs/swagger';

import { Length, IsString } from 'class-validator';

export class DidDto {
  @ApiModelProperty({ example: 'did:sov:exampleExampleExample' })
  @Length(29, 30)
  public readonly did: string;
}

export class DidsDto {
  @ApiModelProperty({
    example:
      '[{ "did": "did:sov:exampleExampleExampleA"}, { "did": "did:sov:exampleExampleExampleB"}]',
  })
  @IsString()
  public readonly dids: string;
}
