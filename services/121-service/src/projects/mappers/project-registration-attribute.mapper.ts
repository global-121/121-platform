import { ProjectRegistrationAttributeDto } from '@121-service/src/projects/dto/project-registration-attribute.dto';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';

export class ProjectRegistrationAttributeMapper {
  public static entitiesToDtos(
    entities: ProjectRegistrationAttributeEntity[],
  ): ProjectRegistrationAttributeDto[] {
    return entities.map((entity) => this.entityToDto(entity));
  }

  public static entityToDto(
    entity: ProjectRegistrationAttributeEntity,
  ): ProjectRegistrationAttributeDto {
    return {
      name: entity.name,
      label: entity.label,
      type: entity.type,
      isRequired: entity.isRequired,
      options: entity.options ?? undefined,
      scoring: entity.scoring,
      pattern: entity.pattern ?? undefined,
      showInPeopleAffectedTable: entity.showInPeopleAffectedTable,
      editableInPortal: entity.editableInPortal,
      includeInTransactionExport: entity.includeInTransactionExport,
      duplicateCheck: entity.duplicateCheck,
      placeholder: entity.placeholder ?? undefined,
    };
  }

  public static dtosToEntities(
    attributes: ProjectRegistrationAttributeDto[],
  ): Partial<ProjectRegistrationAttributeEntity>[] {
    return attributes.map((attribute) => this.dtoToEntity(attribute));
  }

  private static dtoToEntity(
    attribute: ProjectRegistrationAttributeDto,
  ): Partial<ProjectRegistrationAttributeEntity> {
    return {
      name: attribute.name,
      label: attribute.label,
      type: attribute.type,
      isRequired: attribute.isRequired,
      options: attribute.options ?? null,
      scoring: attribute.scoring,
      pattern: attribute.pattern ?? null,
      showInPeopleAffectedTable: attribute.showInPeopleAffectedTable,
      editableInPortal: attribute.editableInPortal,
      includeInTransactionExport: attribute.includeInTransactionExport ?? false,
      duplicateCheck: attribute.duplicateCheck,
      placeholder: attribute.placeholder ?? null,
    };
  }
}
