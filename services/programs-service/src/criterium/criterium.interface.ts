import { UserData } from "../user/user.interface";
import { CriteriumEntity } from './criterium.entity';

// export interface CriteriumData {
//     criterium: string;
//     type: string;
//     author?: UserData;
// }
  
export interface CriteriumRO {
    criterium: CriteriumEntity;
}

export interface CriteriumsRO {
    criteriums: CriteriumEntity[];
}