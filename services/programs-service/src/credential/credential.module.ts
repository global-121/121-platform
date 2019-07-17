import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { AuthMiddleware } from '../user/auth.middleware';

@Module({
  imports: [],
  providers: [CredentialService],
  controllers: [CredentialController],
})
export class CredentialModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'credential/issue', method: RequestMethod.POST },
      );
  }
}
