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

    let requestedAttributes = [];
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
      requestedAttributes.push(attribute);
    }

    let proofRequest = {
      nonce: '1432422343242122312411212',
      name: 'Inclusion-request',
      version: '0.1',
      requested_attributes: requestedAttributes,
      requested_predicates: {},
    };

    return proofRequest;
  }

  public async postProof(
    programId: number,
    did: string,
    encryptedProof: string,
  ): Promise<object> {
    programId;
    did;
    encryptedProof;
    return proofExample;
  }
}
