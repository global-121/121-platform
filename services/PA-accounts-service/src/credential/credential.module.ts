import { UserEntity } from './../user/user.entity';
import { DataStorageModule } from './../data-storage/data-storage.module';
import { Module, HttpModule } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    DataStorageModule,
    UserModule,
    ServicesModule,
    HttpModule,
  ],
  providers: [CredentialService],
  controllers: [CredentialController],
})
export class CredentialModule {}
