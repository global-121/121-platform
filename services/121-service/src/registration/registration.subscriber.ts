import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';
import { AppDataSource } from '../../appdatasource';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { RegistrationEntity } from './registration.entity';

@EventSubscriber()
export class RegistrationSubscriber
  implements EntitySubscriberInterface<RegistrationEntity>
{
  public listenTo(): any {
    return RegistrationEntity;
  }

  public async afterUpdate(
    event: UpdateEvent<RegistrationEntity>,
  ): Promise<void> {
    await this.storeRegistrationStatusChange(event.entity);
  }

  private async storeRegistrationStatusChange(
    registration: any,
  ): Promise<void> {
    if (!registration || !registration.id) {
      return;
    }
    const registrationStatusRepo = AppDataSource.getRepository(
      RegistrationStatusChangeEntity,
    );
    const foundRegistration = await AppDataSource.getRepository(
      RegistrationEntity,
    ).findOne({ where: { id: registration.id } });

    const oldRegistrationStatus = await registrationStatusRepo.findOne({
      where: {
        registrationId: foundRegistration.id,
      },
      order: { created: 'DESC' },
    });

    // Only add a regisration status change value if registrationStatus value is: filled & (new || different)
    if (
      registration.registrationStatus &&
      (!oldRegistrationStatus ||
        oldRegistrationStatus.registrationStatus !==
          registration.registrationStatus)
    ) {
      const registrationStatusChange = new RegistrationStatusChangeEntity();
      registrationStatusChange.registrationStatus =
        registration.registrationStatus;
      registrationStatusChange.registration = registration;
      await registrationStatusRepo.insert(registrationStatusChange);
    }
  }
}
