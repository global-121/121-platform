import { Length, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class SetPhoneRequestDto {
         @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
         @Length(29, 30)
         public readonly did: string;
         @ApiModelProperty({ example: '0031600000000' })
         @ValidateIf(o => o.length > 0)
         @IsString()
         public readonly phonenumber: string;
         @ValidateIf(o => o.length > 0)
         @ApiModelProperty({ example: 'en' })
         @IsString()
         @Length(2, 5)
         public readonly language: string;
       }
