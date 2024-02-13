import { UserOwnerDto } from '../dto/user-owner.dto';
import { UserEntity } from '../user.entity';

export class UserMapper {
  static entityToOwner(userEntity: UserEntity): UserOwnerDto {
    const userOwnerDto = new UserOwnerDto();
    userOwnerDto.id = userEntity.id;
    userOwnerDto.username = userEntity.username;
    return userOwnerDto;
  }
}
