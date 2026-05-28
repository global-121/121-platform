import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, ValidateNested } from 'class-validator';

export class GraphEmailAddressDto {
  @ApiProperty({ example: 'user@example.org' })
  @IsEmail()
  public readonly address: string;
}

export class GraphRecipientDto {
  @ApiProperty({ type: GraphEmailAddressDto })
  @ValidateNested()
  @Type(() => GraphEmailAddressDto)
  public readonly emailAddress: GraphEmailAddressDto;
}
