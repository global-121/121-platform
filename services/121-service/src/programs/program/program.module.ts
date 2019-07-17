import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ProgramController } from './program.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from './program.entity';
import { UserEntity } from '../../user/user.entity';
import { ProgramService } from './program.service';
import { AuthMiddleware } from '../../user/auth.middleware';
import { AuthMiddlewareAdmin } from '../../user/auth.middlewareAdmin';
import { UserModule } from '../../user/user.module';
import { CustomCriterium } from './custom-criterium.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgramEntity, UserEntity, CustomCriterium]),
    UserModule,
  ],
  providers: [ProgramService],
  controllers: [ProgramController],
})
export class ProgramModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddlewareAdmin)
      .forRoutes(
        { path: 'programs', method: RequestMethod.GET },
        { path: 'programs', method: RequestMethod.POST },
        { path: 'programs/:id', method: RequestMethod.DELETE },
        { path: 'programs/:id', method: RequestMethod.PUT },
        { path: 'programs/publish/:id', method: RequestMethod.POST },
        { path: 'programs/unpublish/:id', method: RequestMethod.POST },
      );
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'programs/:id', method: RequestMethod.GET });
  }
}
