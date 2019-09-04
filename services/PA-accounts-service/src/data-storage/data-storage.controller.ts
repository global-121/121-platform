import {
  Get,
  Post,
  Body,
  Param,
  Controller
} from '@nestjs/common';
import { DataStorageService } from './data-storage.service';
import { StoreDataDto } from './dto';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { DataStorageEntity } from './data-storage.entity';
import { User } from '../user/user.decorator';

@ApiUseTags('data-storage')
@Controller()
export class DataStorageController {

  private readonly dataStorageService: DataStorageService;

  public constructor(dataStorageService: DataStorageService) {
    this.dataStorageService = dataStorageService;
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Post data to storage' })
  @Post('data-storage')
  public async post(
    @User('id') userId: number,
    @Body() storeData: StoreDataDto,
  ): Promise<DataStorageEntity> {
    return await this.dataStorageService.post(userId, storeData);
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Get data from storage' })
  @ApiImplicitParam({ name: 'username', description: 'string', required: true, type: 'string' })
  @ApiImplicitParam({ name: 'type', description: 'string', required: true, type: 'string' })
  @Get('data-storage/:username/:type')
  public async get(
    @User('id') userId: number,
    @Param() params,
  ): Promise<String> {
    return await this.dataStorageService.get(userId, params);
  }

}
