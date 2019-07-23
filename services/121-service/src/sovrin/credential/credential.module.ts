import { UserModule } from '../../user/user.module';
import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { AuthMiddlewareAW } from '../../user/auth.middlewareAW';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../user/user.entity';
import { ProgramEntity } from '../../programs/program/program.entity';
import { CredentialEntity } from './credential.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ProgramEntity, CredentialEntity]), UserModule],
  providers: [CredentialService],
  controllers: [CredentialController],
  exports: [CredentialService],
})
export class CredentialModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddlewareAW)
      .forRoutes({ path: 'credential/issue', method: RequestMethod.POST });
  }
}
