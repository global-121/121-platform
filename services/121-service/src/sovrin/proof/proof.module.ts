import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  forwardRef,
} from '@nestjs/common';
import { ProofController } from './proof.controller';
import { ProofService } from './proof.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../../programs/program/program.entity';
import { CustomCriterium } from '../../programs/program/custom-criterium.entity';
import { UserEntity } from '../../user/user.entity';
import { ConnectionEntity } from '../create-connection/connection.entity';
import { UserModule } from '../../user/user.module';
import { ProgramModule } from '../../programs/program/program.module';
import { SchemaModule } from '../schema/schema.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      CustomCriterium,
      UserEntity,
      ConnectionEntity,
    ]),
    UserModule,
    forwardRef(() => ProgramModule),
  ],
  controllers: [ProofController],
  providers: [ProofService],
  exports: [ProofService],
})
export class ProofModule {}
