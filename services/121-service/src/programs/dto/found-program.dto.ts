import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { FilterAttributeDto } from '@121-service/src/registration/dto/filter-attribute.dto';

// Relations back to the program/fsp-configuration are stripped to avoid a circular type when this DTO is converted on the frontend
type FoundProgramFspConfigurationDto = Omit<
  ProgramFspConfigurationEntity,
  'transactionEvents' | 'registrations' | 'properties'
> & {
  properties: Omit<
    ProgramFspConfigurationPropertyEntity,
    'programFspConfiguration'
  >[];
};

// TODO: refactor this to be a proper DTO
export interface FoundProgramDto
  extends
    Omit<ProgramEntity, 'monitoringDashboardUrl' | 'programFspConfigurations'>,
    Partial<Pick<ProgramEntity, 'monitoringDashboardUrl'>> {
  filterableAttributes?: {
    group: string;
    filters: FilterAttributeDto[];
  }[];
  programFspConfigurations: FoundProgramFspConfigurationDto[];
}
