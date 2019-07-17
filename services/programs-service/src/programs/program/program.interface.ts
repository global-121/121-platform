import { UserData } from '../../user/user.interface';
import { ProgramEntity } from './program.entity';

// interface ProgramData {
//   slug: string;
//   title: string;
//   description: string;
//   body?: string;
//   createdAt?: Date
//   updatedAt?: Date
//   author?: UserData;
// }

export interface ProgramRO {
  program: ProgramEntity;
}

export interface ProgramsRO {
  programs: ProgramEntity[];
  programsCount: number;
}
