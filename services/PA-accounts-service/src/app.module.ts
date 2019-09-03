import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { HealthModule } from './health.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    UserModule,
    HealthModule,
  ],
  controllers: [
    AppController,
    // CreateConnectionController,
    // CredentialController,
  ],
  providers: [],
})
export class ApplicationModule {
  public constructor(private readonly connection: Connection) { }
}
