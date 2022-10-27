import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateInstanceDto {
  @ApiProperty({ example: 'NGO-name' })
  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @ApiProperty({ example: { en: 'NGO display name' } })
  @IsOptional()
  public readonly displayName: JSON;

  @ApiProperty({
    example: { en: '<data policy>' },
  })
  @IsOptional()
  public readonly dataPolicy: JSON;

  @ApiProperty({
    example: { en: '<about program>' },
  })
  @IsOptional()
  public readonly aboutProgram: JSON;

  @ApiProperty({
    example: { en: '<contact details>' },
  })
  @IsOptional()
  public readonly contactDetails: JSON;
}
