import { RegistrationEntity } from './registration.entity';
import {
  EventSubscriber,
  EntitySubscriberInterface,
  getConnection,
  UpdateEvent,
  InsertEvent,
} from 'typeorm';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';

@EventSubscriber()
export class RegistrationSubscriber
  implements EntitySubscriberInterface<RegistrationEntity> {
  public listenTo(): any {
    return RegistrationEntity;
  }

  public async afterUpdate(
    event: UpdateEvent<RegistrationEntity>,
  ): Promise<void> {
    await this.storeRegistrationStatusChange(event.entity);
  }

  private async storeRegistrationStatusChange(
    registration: RegistrationEntity,
  ): Promise<void> {
    const registrationStatusRepo = getConnection().getRepository(
      RegistrationStatusChangeEntity,
    );
    const foundRegistration = await getConnection()
      .getRepository(RegistrationEntity)
      .findOne(registration.id);

    const oldRegistrationStatus = await registrationStatusRepo.findOne({
      where: {
        registration: foundRegistration,
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
