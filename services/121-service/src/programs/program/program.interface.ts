import { UserData } from '../../user/user.interface';
import { ProgramEntity } from './program.entity';

export interface SimpleProgramRO {
  id: number;
  title: string;
  published: boolean;
}

export interface ProgramRO {
  program: ProgramEntity;
}

export interface ProgramsRO {
  programs: ProgramEntity[];
  programsCount: number;
}
