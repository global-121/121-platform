import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FspDto } from '@121-service/src/fsps/fsp.dto';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { stringIsFsp } from '@121-service/src/fsps/fsp-settings.helpers';

@Injectable()
export class FspsService {
  public async getFspByName(name: string): Promise<FspDto> {
    // Check if name is an Fsps enum value
    if (!stringIsFsp(name)) {
      throw new HttpException(
        `Fsp not found. Available FSPs: ${Object.values(Fsps).join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return FSP_SETTINGS[name];
  }

  public async getAllFsps(): Promise<FspDto[]> {
    return Object.values(FSP_SETTINGS).filter(
      (fsp) => fsp.name !== Fsps.deprecatedJumbo,
    );
  }
}
