import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { DataStorageModule } from './data-storage/data-storage.module';
import { HealthModule } from './health.module';
import { CredentialModule } from './credential/credential.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    UserModule,
    DataStorageModule,
    HealthModule,
    CredentialModule,
    ServicesModule,
  ],
  controllers: [AppController],
  providers: [],
  exports: [],
})
export class ApplicationModule {
  public constructor(private readonly connection: Connection) {}
}
