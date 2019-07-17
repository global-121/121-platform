import { Length, IsNotEmpty, IsString } from 'class-validator';

export class ConnectionRequestDto {
  @Length(30, 30)
  public readonly did: string;
  @IsNotEmpty()
  @IsString()
  public readonly nonce: string;
}
