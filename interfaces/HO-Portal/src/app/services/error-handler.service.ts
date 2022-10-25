import { ErrorHandler, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LoggingService } from './logging.service';

@Injectable()
export class ErrorHandlerService extends ErrorHandler {
  constructor(
    private loggingService: LoggingService,
    private translate: TranslateService,
  ) {
    super();
  }

  handleError(error: Error) {
    this.loggingService.logException(error);
    const originalError = this.getOriginalError(error);

    if (originalError !== error) {
      this.loggingService.logException(originalError);
    }
  }

  private getOriginalError(error: any) {
    while (error && error.originalError) {
      error = error.originalError;
    }
    return error;
  }

  formatErrors(error, attribute?: string): string {
    if (error.status === 400) {
      if (Array.isArray(error.error.message)) {
        return this.formatConstraintsErrors(error.error.message, attribute);
      } else {
        return '<br><br>' + error.error.message + '<br>';
      }
    }
    if (error.error.message) {
      return '<br><br>' + error.error.message + '<br>';
    }
  }

  private formatConstraintsErrors(errors, attribute?: string): string {
    let attributeConstraints = [];
    if (attribute) {
      const attributeError = errors.find(
        (message) => message.property === attribute,
      );
      const attributeConstraints = Object.values(attributeError.constraints);
      return '<br><br>' + attributeConstraints.join('<br>');
    }
    for (const error of errors) {
      const constraints = Object.values(error.constraints).map((c: string) =>
        this.replaceErrorMessages(c),
      );
      attributeConstraints = attributeConstraints.concat(constraints);
    }
    return (
      '<br><br>' +
      attributeConstraints.join('<br>') +
      '<br><br>' +
      this.translate.instant('common.try-again-contact-support')
    );
  }

  private replaceErrorMessages(errorMessage: string): string {
    switch (errorMessage) {
      case "The value '[]' given for the attribute 'skills' does not have the correct format for type 'multi-select'":
        return this.translate.instant('common.answer-is-required');

      default:
        return errorMessage;
    }
  }
}
