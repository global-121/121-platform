import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrganizationController } from '@121-service/src/organization/organization.controller';
import { OrganizationEntity } from '@121-service/src/organization/organization.entity';
import { OrganizationRepository } from '@121-service/src/organization/organization.repository';
import { OrganizationService } from '@121-service/src/organization/organization.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationEntity])],
  providers: [OrganizationService, OrganizationRepository],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}
