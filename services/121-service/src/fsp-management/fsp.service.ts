import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsp-management/fsp-settings.const';
import { stringIsFsp } from '@121-service/src/fsp-management/fsp-settings.helpers';
import { FspUserConfigurableDto } from '@121-service/src/fsp-management/fsp-user-configurable.dto';

@Injectable()
export class FspsService {
  public async getFspByName(name: string): Promise<FspUserConfigurableDto> {
    // Check if name is an Fsps enum value
    if (!stringIsFsp(name)) {
      throw new HttpException(
        `Fsp not found. Available FSPs: ${Object.values(Fsps).join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return FSP_SETTINGS[name];
  }

  public async getAllFsps(): Promise<FspUserConfigurableDto[]> {
    return Object.values(FSP_SETTINGS);
  }
}
