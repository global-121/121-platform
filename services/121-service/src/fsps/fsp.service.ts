import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { FspDto } from '@121-service/src/fsps/fsp.dto';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';

@Injectable()
export class FspsService {
  public async getFspByName(name: string): Promise<FspDto> {
    const fsp = FSP_SETTINGS.find((fsp) => fsp.name === name);
    if (!fsp) {
      const availableFsps = FSP_SETTINGS.map((fsp) => fsp.name).join(', ');
      throw new HttpException(
        `Fsp not found. Available FSPs: ${availableFsps}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return fsp;
  }

  public async getAllFsps(): Promise<FspDto[]> {
    return FSP_SETTINGS;
  }
}
