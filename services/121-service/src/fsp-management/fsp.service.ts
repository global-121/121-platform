import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { FSP_MODES } from '@121-service/src/fsp-integrations/settings/fsp-env-variable-settings.const';
import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspSettingsDto } from '@121-service/src/fsp-management/fsp-settings.dto';
import { stringIsFsp } from '@121-service/src/fsp-management/fsp-settings.helpers';

@Injectable()
export class FspsService {
  public async getFspByName(name: string): Promise<FspSettingsDto> {
    // Check if name is an Fsps enum value
    if (!stringIsFsp(name)) {
      throw new HttpException(
        `Fsp not found. Available FSPs: ${Object.values(Fsps).join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return FSP_SETTINGS[name];
  }

  public async getEnabledFsps(): Promise<FspSettingsDto[]> {
    // Disabled FSPs should not be configurable via the API or visible in the
    // admin UI, so they are never returned here (AB#39826).
    return Object.values(FSP_SETTINGS).filter(
      (fsp) => FSP_MODES[fsp.name] !== FspMode.disabled,
    );
  }
}
