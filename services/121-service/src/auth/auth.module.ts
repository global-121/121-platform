import { AzureAdStrategy } from '@121-service/src/strategies/azure-ad.strategy';
import { CookieJwtStrategy } from '@121-service/src/strategies/cookie-jwt.strategy';
import { UserModule } from '@121-service/src/user/user.module';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'cookie-jwt' }),
  ],
  providers: [AzureAdStrategy, CookieJwtStrategy],
})
export class AuthModule {}
