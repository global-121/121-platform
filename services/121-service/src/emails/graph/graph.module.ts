import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { AzureGraphTokenService } from '@121-service/src/emails/graph/azure-graph-token.service';
import { GraphService } from '@121-service/src/emails/graph/graph.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [HttpModule],
  providers: [GraphService, AzureGraphTokenService, CustomHttpService],
  controllers: [],
  exports: [GraphService],
})
export class GraphModule {}
