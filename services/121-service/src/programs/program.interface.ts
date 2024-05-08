import { LocalizedString } from 'src/shared/enum/language.enums';
import { ProgramEntity } from './program.entity';

export interface ProgramsRO {
  programs: ProgramEntity[];
  programsCount: number;
}
