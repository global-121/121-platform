import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log('🚀 ~ ValidationPipe ~ transform ~ metadata:', metadata);
    return value;
  }
}
