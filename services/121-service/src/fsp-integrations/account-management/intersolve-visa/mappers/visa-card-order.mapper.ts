import { VisaCardOrderResponseDto } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/dto/visa-card-order-response.dto';
import { VisaCardOrderEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-card-order.entity';

export class VisaCardOrderMapper {
  public static mapEntitiesToDtos({
    entities,
  }: {
    entities: VisaCardOrderEntity[];
  }): VisaCardOrderResponseDto[] {
    return entities.map((entity) => this.mapEntityToDto({ entity }));
  }

  public static mapEntityToDto({
    entity,
  }: {
    entity: VisaCardOrderEntity;
  }): VisaCardOrderResponseDto {
    return {
      id: entity.id,
      noOfCardsOrdered: entity.noOfCardsOrdered,
      address: this.formatAddressForDisplay({ entity }),
      orderedByUsername: entity.user?.username ?? `${entity.userId}`,
      created: entity.created,
    };
  }

  private static formatAddressForDisplay({
    entity,
  }: {
    entity: VisaCardOrderEntity;
  }): string {
    const houseNumberWithOptionalAddition = entity.addressHouseNumberAddition
      ? `${entity.addressHouseNumber} ${entity.addressHouseNumberAddition}`
      : entity.addressHouseNumber;

    return `${entity.addressee}, ${entity.addressStreet} ${houseNumberWithOptionalAddition}, ${entity.addressPostalCode}, ${entity.addressCity}`;
  }
}
