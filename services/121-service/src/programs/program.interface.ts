import { ProgramEntity } from './program.entity';

export interface SimpleProgramRO {
  id: number;
  titlePortal: JSON;
  phase: string;
}

export interface ProgramRO {
  program: ProgramEntity;
}

export interface ProgramsRO {
  programs: ProgramEntity[];
  programsCount: number;
}
