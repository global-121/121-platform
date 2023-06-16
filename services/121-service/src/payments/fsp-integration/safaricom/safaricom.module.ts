import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SafaricomController } from './safaricom.controller';
import { SafaricomService } from './safaricom.service';
import { SafaricomApiService } from './safaricom.api.service';
import { TransactionsModule } from '../../transactions/transactions.module';
import { CustomHttpService } from '../../../shared/services/custom-http.service';

@Module({
 imports: [ TransactionsModule, HttpModule ],
  controllers: [SafaricomController],
  providers: [SafaricomService, 
              SafaricomApiService,
              CustomHttpService,],
})
export class SafaricomModule {}
