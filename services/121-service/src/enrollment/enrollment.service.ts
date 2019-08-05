import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult } from 'typeorm';
import { Injectable, HttpException } from '@nestjs/common';
// import { EnrollmentEntity } from './enrollment.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { CustomCriterium } from '../programs/program/custom-criterium.entity';
import { ConnectionEntity } from '../sovrin/create-connection/connection.entity';

@Injectable()
export class EnrollmentService {

  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;
  @InjectRepository(CustomCriterium)
  private readonly customCriteriumRepository: Repository<CustomCriterium>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor() {}

  public async getProofRequest(programId: number): Promise<any> {
    // let program = this.programRepository.findOne(programId);
    let criteriums = await this.customCriteriumRepository.find({where: {programId: programId}});

    ` get cref_def_id`;

    let requested_attributes = [];
    for(let i=0;i<criteriums.length;i++){
      let attribute = {};
      attribute['attr'+(i+1)+'_referent'] = {
        name: criteriums[i].criterium,
        restrictions: [{
          cred_def_id: "JzLHazRLRT17EHH51gyizc:3:CL:11726:TAG2"
        }]
      };
      requested_attributes.push(attribute);
    }

    let proof_request = {
      nonce: "1432422343242122312411212",
      name: "Inclusion-request",
      version: "0.1",
      requested_attributes: requested_attributes,
      requested_predicates: {}
    };

    return proof_request;
  }

  public async postProof(programId: number, did: string): Promise<ConnectionEntity> {
    `
    The proof itself has to be added to this function as input parameter.
    Verifier/HO gets schema_id/cred_def_id from ledger and validates proof.
    Inclusion algorithm is run. (Allocation algorithm as well?)
    Inclusion result is added to db (connectionRepository)?
    When done (time-loop): run getInclusionStatus from PA.
    `;

    let inclusionResult = 1;
    
    let connection = await this.connectionRepository.findOne({where: {did: did}});
    if (!connection) {
      const errors = 'No connection found for PA.';
      throw new HttpException({ errors }, 401);
    };
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, 401);
    };

    if (connection.programsEnrolled.indexOf(programId) <= -1) {
      connection.programsEnrolled.push(programId);
      if (inclusionResult == 1) {connection.programsIncluded.push(programId);};
    } else {
      const errors = 'PA already enrolled earlier for this program.';
      throw new HttpException({ errors }, 401);
    };
    const updatedConnection = await this.connectionRepository.save(connection);    

    // Immediately run getInclusionStatus, when ready (with time-loop)
    // let inclusionStatus = await this.getInclusionStatus(programId, did);
    // return inclusionStatus;

    return updatedConnection;
  }

  public async getInclusionStatus(programId: number, did: string): Promise<any> {
        
    let connection = await this.connectionRepository.findOne({where: {did: did}});
    if (!connection) {
      const errors = 'No connection found for PA.';
      throw new HttpException({ errors }, 401);
    };
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, 401);
    };

    let inclusionStatus: number;
    if (connection.programsIncluded.indexOf(parseInt(String(programId),10)) > -1) {
      inclusionStatus = 1;
    } else if (connection.programsEnrolled.indexOf(parseInt(String(programId),10)) > -1) {
      inclusionStatus = 0;
    } else {
      const errors = 'PA not enrolled in this program yet.';
      throw new HttpException({ errors }, 401);
    }
    return inclusionStatus;
  }

}
