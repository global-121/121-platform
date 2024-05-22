import { ProgramEntity } from '@121-service/src/programs/program.entity';

export interface ProgramsRO {
  programs: ProgramEntity[];
  programsCount: number;
}
