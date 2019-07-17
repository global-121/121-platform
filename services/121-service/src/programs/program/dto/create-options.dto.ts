import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateOptionsDto {
  public readonly id: number;
  public readonly option: string;
  public readonly name: JSON;
}
