import { ProgramService } from './../../programs/program/program.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult } from 'typeorm';
import { Injectable, HttpException } from '@nestjs/common';
import { ConnectionEntity } from '../create-connection/connection.entity';
import { CustomCriterium } from '../../programs/program/custom-criterium.entity';
import { ProgramEntity } from '../../programs/program/program.entity';
import proofExample from '../../../examples/proof.json';

@Injectable()
export class ProofService {
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;
  @InjectRepository(CustomCriterium)
  private readonly customCriteriumRepository: Repository<CustomCriterium>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor() {}

  public async getProofRequest(programId: number): Promise<any> {
    // let program = this.programRepository.findOne(programId);
    let criteriums = await this.customCriteriumRepository.find({
      where: { programId: programId },
    });

    ` get cref_def_id`;

    let requested_attributes = [];
    for (let i = 0; i < criteriums.length; i++) {
      let attribute = {};
      attribute['attr' + (i + 1) + '_referent'] = {
        name: criteriums[i].criterium,
        restrictions: [
          {
            cred_def_id: 'JzLHazRLRT17EHH51gyizc:3:CL:11726:TAG2',
          },
        ],
      };
      requested_attributes.push(attribute);
    }

    let proof_request = {
      nonce: '1432422343242122312411212',
      name: 'Inclusion-request',
      version: '0.1',
      requested_attributes: requested_attributes,
      requested_predicates: {},
    };

    return proof_request;
  }

  public async postProof(
    programId: number,
    did: string,
  ): Promise<ConnectionEntity> {
    `
    The proof itself has to be added to this function as input parameter.
    Verifier/HO gets schema_id/cred_def_id from ledger and validates proof.
    Inclusion algorithm is run. (Allocation algorithm as well?)
    Inclusion result is added to db (connectionRepository)?
    When done (time-loop): run getInclusionStatus from PA.
    `;

    let connection = await this.connectionRepository.findOne({
      where: { did: did },
    });
    if (!connection) {
      const errors = 'No connection found for PA.';
      throw new HttpException({ errors }, 401);
    }

    if (connection.programsEnrolled.includes(+programId)) {
      const errors = 'Already enrolled for program';
      throw new HttpException({ errors }, 401);
    }

    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, 401);
    }

    const proof = proofExample;
    const programService = new ProgramService();
    let inclusionResult = await programService.calculateInclusion(
      programId,
      proof,
      did,
    );

    if (connection.programsEnrolled.indexOf(programId) <= -1) {
      connection.programsEnrolled.push(programId);
      if (inclusionResult) {
        connection.programsIncluded.push(programId);
      } else if (!inclusionResult) {
        connection.programsExcluded.push(programId);
      }
    } else {
      const errors = 'PA already enrolled earlier for this program.';
      throw new HttpException({ errors }, 401);
    }
    const updatedConnection = await this.connectionRepository.save(connection);

    // Immediately run getInclusionStatus, when ready (with time-loop
    return updatedConnection;
  }
}
