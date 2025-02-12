import { ProjectEntity } from '@121-service/src/programs/project.entity';
import { FilterAttributeDto } from '@121-service/src/registration/dto/filter-attribute.dto';

// TODO: refactor this to be a proper DTO
export interface FoundProgramDto
  extends Omit<
      ProjectEntity,
      'monitoringDashboardUrl' | 'programFspConfiguration'
    >,
    Partial<Pick<ProjectEntity, 'monitoringDashboardUrl'>> {
  filterableAttributes?: {
    group: string;
    filters: FilterAttributeDto[];
  }[];
}
