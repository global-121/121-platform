import { AuthenticatedUserParameters } from '@121-service/src/guards/authenticated-user.decorator';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class AuthenticatedUserGuard
  extends AuthGuard(['cookie-jwt', 'azure-ad'])
  implements CanActivate
{
  public constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const endpointParameters = this.reflector.get<AuthenticatedUserParameters>(
      'authenticationParameters',
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest();
    request.authenticationParameters = endpointParameters;
    if (!endpointParameters?.isGuarded) {
      return true;
    }
    return super.canActivate(context);
  }
}
