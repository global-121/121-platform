import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Injectable,
  HttpException,
  HttpService,
  HttpStatus,
} from '@nestjs/common';
import { ConnectionEntity } from '../create-connection/connection.entity';
import { CustomCriterium } from '../../programs/program/custom-criterium.entity';
import { ProgramEntity } from '../../programs/program/program.entity';
import { API } from '../../config';

@Injectable()
export class ProofService {
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;
  @InjectRepository(CustomCriterium)
  private readonly customCriteriumRepository: Repository<CustomCriterium>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(private readonly httpService: HttpService) {}

  public createProofRequest(
    program: ProgramEntity,
    credDefId: string,
  ): Record<string, any> {
    const criteriums = program.customCriteria;
    let requestedAttributes = {};
    for (let i = 0; i < criteriums.length; i++) {
      requestedAttributes['attr' + (i + 1) + '_referent'] = {
        name: criteriums[i].criterium,
        restrictions: [
          {
            cred_def_id: credDefId,
          },
        ],
      };
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

  public async getProofRequest(programId: number): Promise<any> {
    // let program = this.programRepository.findOne(programId);
    let program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    if (!program.proofRequest) {
      const errors = 'This program has no proof request';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return program.proofRequest;
  }

  public async validateProof(
    proofRequest: string,
    proof: string,
    correlationID: string,
  ): Promise<object> {
    // tyknid.checkProof(encryptedProof);
    const validateProofPost = {
      proofRequestJsonData: proofRequest,
      proof: proof,
      correlation: {
        correlationID: 'test',
      },
    };
    const result = await this.httpService
      .post(API.proof.verify, validateProofPost)
      .toPromise();
    return result;
  }
}
