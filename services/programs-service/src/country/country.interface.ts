import { UserData } from "../user/user.interface";
import { CountryEntity } from './country.entity';

// export interface CountryData {
//     country: string;
//     type: string;
//     author?: UserData;
// }
  
export interface CountryRO {
    country: CountryEntity;
}
