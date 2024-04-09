import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AzureAdStrategy } from '../strategies/azure-ad.strategy';
import { CookieJwtStrategy } from '../strategies/cookie-jwt.strategy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'cookie-jwt' }),
  ],
  providers: [AzureAdStrategy, CookieJwtStrategy],
})
export class AuthModule {}