import { UserMapper } from '../../../../user/utils/user.mapper';
import { RegistrationChangeLogReturnDto } from '../dto/registration-change-log-return.dto';
import { RegistrationChangeLogEntity } from '../registration-change-log.entity';

export class RegistrationChangeLogMapper {
  static toRegistrationChangeLogReturnDto(
    registrationChangeLogEntity: RegistrationChangeLogEntity,
  ): RegistrationChangeLogReturnDto {
    const dto = new RegistrationChangeLogReturnDto();
    dto.id = registrationChangeLogEntity.id;
    dto.registrationId = registrationChangeLogEntity.registrationId;
    dto.user = UserMapper.entityToOwner(registrationChangeLogEntity.user);
    dto.created = registrationChangeLogEntity.created;
    dto.fieldName = registrationChangeLogEntity.fieldName;
    dto.oldValue = registrationChangeLogEntity.oldValue;
    dto.newValue = registrationChangeLogEntity.newValue;
    dto.reason = registrationChangeLogEntity.reason;
    return dto;
  }

  static toRegistrationChangeLogReturnDtos(
    registrationChangeLogEntities: RegistrationChangeLogEntity[],
  ): RegistrationChangeLogReturnDto[] {
    return registrationChangeLogEntities.map((entity) =>
      this.toRegistrationChangeLogReturnDto(entity),
    );
  }
}
