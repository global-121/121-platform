import { UserOwnerDto } from '@121-service/src/user/dto/user-owner.dto';
import { UserEntity } from '@121-service/src/user/user.entity';

export class UserMapper {
  static entityToOwner(userEntity: UserEntity): UserOwnerDto {
    const userOwnerDto = new UserOwnerDto();
    userOwnerDto.id = userEntity.id;
    userOwnerDto.username = userEntity.username;
    return userOwnerDto;
  }
}
