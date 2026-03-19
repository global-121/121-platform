import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RenameProgramAttachmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  public readonly newFilename!: string;
}
