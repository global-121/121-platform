import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SovrinSetupService } from './setup.service';
import { SovrinSetupController } from './setup.controller';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([]), UserModule],
  providers: [SovrinSetupService],
  controllers: [SovrinSetupController],
  exports: [SovrinSetupService],
})
export class SovrinSetupModule {}
