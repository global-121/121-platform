import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UserRoleResponseDTO {
  @ApiProperty({ example: 5 })
  @IsNotEmpty()
  public readonly id: number;

  @ApiProperty({ example: 'field-validation' })
  @IsNotEmpty()
  public readonly role: string;

  @ApiProperty({ example: 'Do Field Validation' })
  @IsNotEmpty()
  public readonly label: string;

  @ApiProperty({
    example: ['registration:attribute.update', 'registration:fsp.read'],
  })
  @IsNotEmpty()
  public readonly permissions: string[];
}
