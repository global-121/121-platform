import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';

export class ProgramRegistrationAttributeMapper {
  public static entitiesToDtos(
    entities: ProjectRegistrationAttributeEntity[],
  ): ProgramRegistrationAttributeDto[] {
    return entities.map((entity) => this.entityToDto(entity));
  }

  public static entityToDto(
    entity: ProjectRegistrationAttributeEntity,
  ): ProgramRegistrationAttributeDto {
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
      export: entity.export as unknown as ExportType[],
      duplicateCheck: entity.duplicateCheck,
      placeholder: entity.placeholder ?? undefined,
    };
  }

  public static dtosToEntities(
    attributes: ProgramRegistrationAttributeDto[],
  ): Partial<ProjectRegistrationAttributeEntity>[] {
    return attributes.map((attribute) => this.dtoToEntity(attribute));
  }

  private static dtoToEntity(
    attribute: ProgramRegistrationAttributeDto,
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
      export: attribute.export as unknown as ExportType[],
      duplicateCheck: attribute.duplicateCheck,
      placeholder: attribute.placeholder ?? null,
    };
  }
}
