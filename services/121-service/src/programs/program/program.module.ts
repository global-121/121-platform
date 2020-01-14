import { FundingModule } from './../../funding/funding.module';
import { VoiceModule } from './../../notifications/voice/voice.module';
import { ProofModule } from './../../sovrin/proof/proof.module';
import { SchemaModule } from './../../sovrin/schema/schema.module';
import { CredentialModule } from './../../sovrin/credential/credential.module';
import { ConnectionEntity } from './../../sovrin/create-connection/connection.entity';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  forwardRef,
  HttpModule,
} from '@nestjs/common';
import { ProgramController } from './program.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from './program.entity';
import { UserEntity } from '../../user/user.entity';
import { ProgramService } from './program.service';
import { AuthMiddlewareAW } from '../../user/auth.middlewareAW';
import { AuthMiddlewareAdmin } from '../../user/auth.middlewareAdmin';
import { UserModule } from '../../user/user.module';
import { CustomCriterium } from './custom-criterium.entity';
import { AuthMiddlewarePM } from '../../user/auth.middlewarePM';
import { ProtectionServiceProviderEntity } from './protection-service-provider.entity';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { SmsModule } from '../../notifications/sms/sms.module';
import { TransactionEntity } from './transactions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      UserEntity,
      CustomCriterium,
      ConnectionEntity,
      FinancialServiceProviderEntity,
      ProtectionServiceProviderEntity,
      TransactionEntity,
    ]),
    forwardRef(() => CredentialModule),
    UserModule,
    SchemaModule,
    forwardRef(() => SmsModule),
    VoiceModule,
    forwardRef(() => ProofModule),
    FundingModule,
    HttpModule,
  ],
  providers: [ProgramService],
  controllers: [ProgramController],
  exports: [ProgramService]
})
export class ProgramModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddlewareAdmin)
      .forRoutes(
        { path: 'programs/enrolledPrivacy', method: RequestMethod.GET },
      );
    consumer
      .apply(AuthMiddlewarePM)
      .forRoutes(
        { path: 'programs', method: RequestMethod.GET },
        { path: 'programs', method: RequestMethod.POST },
        { path: 'programs/:id', method: RequestMethod.PUT },
        { path: 'programs/:id', method: RequestMethod.DELETE },
        { path: 'programs/publish/:id', method: RequestMethod.POST },
        { path: 'programs/unpublish/:id', method: RequestMethod.POST },
        { path: 'programs/enrolled', method: RequestMethod.GET },
        { path: 'programs/include/:id', method: RequestMethod.POST },
        { path: 'programs/exclude/:id', method: RequestMethod.POST },
        { path: 'programs/payout', method: RequestMethod.POST },
        { path: 'programs/funds/:id', method: RequestMethod.GET },
        { path: 'programs/total-included/:id', method: RequestMethod.GET },
      );
    consumer
      .apply(AuthMiddlewareAW)
      .forRoutes({ path: 'programs/:id', method: RequestMethod.GET });
  }
}
