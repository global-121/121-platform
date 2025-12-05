import { FspConfigurationProperties } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { ProgramFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';

import { Dto } from '~/utils/dto-type';

export type FspConfiguration = Dto<ProgramFspConfigurationResponseDto>;

export interface FspFormField {
  name: 'displayName' | FspConfigurationProperties;
  isRequired: boolean;
  isSensitive: boolean;
}
