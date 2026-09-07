import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { FilterAttributeDto } from '@121-service/src/registration/dto/filter-attribute.dto';

// TODO: refactor this to be a proper DTO
export interface FoundProgramDto
  extends
    Omit<ProgramEntity, 'monitoringDashboardUrl' | 'programFspConfiguration'>,
    Partial<Pick<ProgramEntity, 'monitoringDashboardUrl'>> {
  filterableAttributes?: {
    group: string;
    filters: FilterAttributeDto[];
  }[];
}
