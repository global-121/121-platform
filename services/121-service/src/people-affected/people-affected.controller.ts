import { PersonAffectedRole } from '../user/user-role.enum';
import { Post, Body, Controller, UseGuards, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { PeopleAffectedService } from './people-affected.service';
import { User } from '../user/user.decorator';
import { StoreDataDto } from './dto/store-data.dto';
import { PermissionsGuard } from '../permissions.guard';

@UseGuards(PermissionsGuard)
@ApiTags('people-affected')
@Controller('people-affected')
export class PeopleAffectedController {
  private readonly peopleAffectedService: PeopleAffectedService;
  public constructor(peopleAffectedService: PeopleAffectedService) {
    this.peopleAffectedService = peopleAffectedService;
  }
  @ApiOperation({ summary: 'Post data to storage' })
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
  @Get('data-storage/:type')
  public async getData(
    @User('id') userId: number,
    @Param() params,
  ): Promise<string> {
    return await this.peopleAffectedService.getData(userId, params.type);
  }
}
