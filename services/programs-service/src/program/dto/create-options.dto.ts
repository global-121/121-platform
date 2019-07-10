import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateOptionsDto {
  @IsNotEmpty()
  @IsNumber()
  public readonly id: number;
  @IsNotEmpty()
  @IsString()
  public readonly option: string;
  @IsNotEmpty()
  public readonly name: JSON;
}
