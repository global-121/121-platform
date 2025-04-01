import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateUniquesDto {
  @ApiProperty({
    description: `Registration IDs of the registration that need to be marked as unique`,
    example: [1, 2, 8],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @IsNumber({}, { each: true })
  public readonly registrationIds: number[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: `Reason why these registrations should be marked as unique`,
    example: 'Phone number is shared between families',
  })
  public readonly reason: string;
}
