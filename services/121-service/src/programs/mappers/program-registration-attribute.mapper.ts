import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';

export class ProgramRegistrationAttributeMapper {
  public static entitiesToDtos(
    entities: ProgramRegistrationAttributeEntity[],
  ): ProgramRegistrationAttributeDto[] {
    return entities.map((entity) => this.entityToDto(entity));
  }

  public static entityToDto(
    entity: ProgramRegistrationAttributeEntity,
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
      includeInTransactionExport: entity.includeInTransactionExport,
      duplicateCheck: entity.duplicateCheck,
      placeholder: entity.placeholder ?? undefined,
    };
  }

  public static dtosToEntities(
    attributes: ProgramRegistrationAttributeDto[],
  ): Partial<ProgramRegistrationAttributeEntity>[] {
    return attributes.map((attribute) => this.dtoToEntity(attribute));
  }

  private static dtoToEntity(
    attribute: ProgramRegistrationAttributeDto,
  ): Partial<ProgramRegistrationAttributeEntity> {
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
