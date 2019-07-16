import { ApiModelProperty } from '@nestjs/swagger';

export class CreateConnectionDto {
  @ApiModelProperty({ example: 'did:sample' })
  public readonly did: string;
}
