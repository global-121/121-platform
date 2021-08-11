import { RegistrationEntity } from './registration.entity';
import {
  EventSubscriber,
  EntitySubscriberInterface,
  getConnection,
  UpdateEvent,
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
    console.log('event: ', event.entity.id);
    const registrationStatusRepo = getConnection().getRepository(
      RegistrationStatusChangeEntity,
    );
    const foundRegistration = await getConnection()
      .getRepository(RegistrationEntity)
      .findOne(event.entity.id);

    const oldRegistrationStatus = await registrationStatusRepo.findOne({
      where: {
        registration: foundRegistration,
      },
      order: { created: 'DESC' },
    });

    // Only add a regisration status change value if registrationStatus value is different or new
    if (
      !oldRegistrationStatus ||
      oldRegistrationStatus.registrationStatus !==
        event.entity.registrationStatus
    ) {
      const registrationStatusChange = new RegistrationStatusChangeEntity();
      registrationStatusChange.registrationStatus =
        event.entity.registrationStatus;
      registrationStatusChange.registration = event.entity;
      await registrationStatusRepo.insert(registrationStatusChange);
    }
  }
}
