import { OrganizationController } from '@121-service/src/organization/organization.controller';
import { OrganizationEntity } from '@121-service/src/organization/organization.entity';
import { OrganizationService } from '@121-service/src/organization/organization.service';
import { UserModule } from '@121-service/src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationEntity]),
    UserModule,
    HttpModule,
  ],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}
