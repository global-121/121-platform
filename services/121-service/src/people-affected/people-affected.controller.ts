import { Post, Body, Controller, UseGuards, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUseTags,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { RolesGuard } from '../roles.guard';
import { PeopleAffectedService } from './people-affected.service';
import { User } from '../user/user.decorator';
import { StoreDataDto } from './dto/store-data.dto';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('peopleAffected')
@Controller('peopleaffected')
export class PeopleAffectedController {
  private readonly peopleAffectedService: PeopleAffectedService;
  public constructor(peopleAffectedService: PeopleAffectedService) {
    this.peopleAffectedService = peopleAffectedService;
  }
  @ApiBearerAuth()
  @ApiOperation({ title: 'Post data to storage' })
  @Post('datastorage')
  public async postData(
    @User('id') userId: number,
    @Body() storeData: StoreDataDto,
  ): Promise<void> {
    return await this.peopleAffectedService.postData(userId, storeData);
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Get data from storage' })
  @ApiImplicitParam({
    name: 'type',
    description: 'string',
    required: true,
    type: 'string',
  })
  @Get('datastorage/:type')
  public async getData(
    @User('id') userId: number,
    @Param() params,
  ): Promise<string> {
    return await this.peopleAffectedService.getData(userId, params.type);
  }
}
