import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { LocalizedString } from '@121-service/src/shared/enum/language.enums';

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
