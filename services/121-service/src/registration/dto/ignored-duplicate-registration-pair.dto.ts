import { IsNotEmpty, IsString } from 'class-validator';

export class IgnoredDuplicateRegistrationPairDto {
  @IsString()
  @IsNotEmpty()
  public readonly referenceId1: string;

  @IsString()
  @IsNotEmpty()
  public readonly referenceId2: string;

  @IsString()
  @IsNotEmpty()
  public readonly reason: string;
}
