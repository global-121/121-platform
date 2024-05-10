import { LocalizedString } from 'src/shared/enum/language.enums';
import { ProgramEntity } from './program.entity';

export interface SimpleProgramRO {
  id: number;
  titlePortal: LocalizedString;
  phase: string;
}

export interface ProgramRO {
  program: ProgramEntity;
}

export interface ProgramsRO {
  programs: ProgramEntity[];
  programsCount: number;
}
