import {
  HttpStatus,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';
import {
  ErrorHttpStatusCode,
  HttpErrorByCode,
} from '@nestjs/common/utils/http-error-by-code.util';

export interface ParsePositiveNumberPipeOptions {
  errorHttpStatusCode?: ErrorHttpStatusCode;
  exceptionFactory?: (error: string) => any;
  optional?: boolean;
}

@Injectable()
export class ParsePositiveNumberPipe implements PipeTransform<number> {
  protected exceptionFactory: (error: string) => any;

  constructor(
    @Optional() protected readonly options?: ParsePositiveNumberPipeOptions,
  ) {
    options = options || {};
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } =
      options;

    this.exceptionFactory =
      exceptionFactory ||
      ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  async transform(value: number): Promise<number> {
    if (value <= 0) {
      throw this.exceptionFactory(
        `Validation failed (value ${value} is not a positive number)`,
      );
    }
    return value;
  }
}
