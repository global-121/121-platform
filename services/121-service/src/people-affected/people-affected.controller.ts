import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../guards/authenticated-user.guard';
import { StoreDataDto } from './dto/store-data.dto';
import { PeopleAffectedService } from './people-affected.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('people-affected')
@Controller('people-affected')
export class PeopleAffectedController {
  private readonly peopleAffectedService: PeopleAffectedService;
  public constructor(peopleAffectedService: PeopleAffectedService) {
    this.peopleAffectedService = peopleAffectedService;
  }

  // NOTE: PA-app only, so could already be removed, but leaving in as no conflict
  @ApiOperation({ summary: 'Post data to storage' })
  @AuthenticatedUser()
  @Post('data-storage')
  public async postData(
    @Req() req,
    @Body() storeData: StoreDataDto,
  ): Promise<void> {
    const userId = req.user.id;
    return await this.peopleAffectedService.postData(userId, storeData);
  }

  // NOTE: PA-app only, so could already be removed, but leaving in as no conflict
  @ApiOperation({ summary: 'Get data from storage' })
  @ApiParam({
    name: 'type',
    description: 'string',
    required: true,
    type: 'string',
  })
  @AuthenticatedUser()
  @Get('data-storage/:type')
  public async getData(@Req() req, @Param() params): Promise<string> {
    const userId = req.user.id;
    return await this.peopleAffectedService.getData(userId, params.type);
  }
}
