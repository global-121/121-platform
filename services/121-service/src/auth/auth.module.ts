import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AzureAdStrategy } from '../strategies/azure-ad.strategy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'azure-ad' }),
    UserModule,
  ],
  providers: [AzureAdStrategy],
})
export class AuthModule {}
