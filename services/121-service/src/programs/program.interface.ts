import { ProgramEntity } from '@121-service/src/programs/program.entity';

export interface ProgramsRO {
  programs: (Omit<ProgramEntity, 'programFspConfiguration'> &
    Partial<Pick<ProgramEntity, 'programFspConfiguration'>>)[];
  programsCount: number;
}
