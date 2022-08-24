import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length } from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  @IsString()
  public readonly referenceId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly programId: number;
}
