import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PersonAffectedAuth } from '../guards/person-affected-auth.decorator';
import { PersonAffectedAuthGuard } from '../guards/person-affected-auth.guard';
import { User } from '../user/user.decorator';
import { StoreDataDto } from './dto/store-data.dto';
import { PeopleAffectedService } from './people-affected.service';

@UseGuards(PersonAffectedAuthGuard)
@ApiTags('people-affected')
@Controller('people-affected')
export class PeopleAffectedController {
  private readonly peopleAffectedService: PeopleAffectedService;
  public constructor(peopleAffectedService: PeopleAffectedService) {
    this.peopleAffectedService = peopleAffectedService;
  }
  @ApiOperation({ summary: 'Post data to storage' })
  @PersonAffectedAuth()
  @Post('data-storage')
  public async postData(
    @User('id') userId: number,
    @Body() storeData: StoreDataDto,
  ): Promise<void> {
    return await this.peopleAffectedService.postData(userId, storeData);
  }

  @ApiOperation({ summary: 'Get data from storage' })
  @ApiParam({
    name: 'type',
    description: 'string',
    required: true,
    type: 'string',
  })
  @PersonAffectedAuth()
  @Get('data-storage/:type')
  public async getData(
    @User('id') userId: number,
    @Param() params,
  ): Promise<string> {
    return await this.peopleAffectedService.getData(userId, params.type);
  }
}
