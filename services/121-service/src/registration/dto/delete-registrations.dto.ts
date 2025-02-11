import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteRegistrationsDto {
  @IsString()
  @IsNotEmpty()
  public reason: string;
}
