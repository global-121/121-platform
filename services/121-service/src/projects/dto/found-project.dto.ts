import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { FilterAttributeDto } from '@121-service/src/registration/dto/filter-attribute.dto';

// TODO: refactor this to be a proper DTO
export interface FoundProjectDto
  extends Omit<
      ProjectEntity,
      'monitoringDashboardUrl' | 'projectFspConfiguration'
    >,
    Partial<Pick<ProjectEntity, 'monitoringDashboardUrl'>> {
  filterableAttributes?: {
    group: string;
    filters: FilterAttributeDto[];
  }[];
}
