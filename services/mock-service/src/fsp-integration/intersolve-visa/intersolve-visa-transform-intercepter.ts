import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class IntersolveVisaTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    return next.handle().pipe(
      map((res) => {
        response.status(res.status).set('X-Status-Text', res.statusText);
        return res.data;
      }),
    );
  }
}
