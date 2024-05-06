import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from '../registration/enum/custom-data-attributes';
import {
  CreateFspAttributeDto,
  UpdateFinancialServiceProviderDto,
  UpdateFinancialServiceProviderQuestionDto,
} from './dto/update-financial-service-provider.dto';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FspQuestionEntity } from './fsp-question.entity';

@Injectable()
export class FinancialServiceProvidersService {
  @InjectRepository(FinancialServiceProviderEntity)
  private financialServiceProviderRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(FspQuestionEntity)
  public financialServiceProviderQuestionRepository: Repository<FspQuestionEntity>;

  public async getById(id: number): Promise<FinancialServiceProviderEntity> {
    const financialServiceProvider =
      await this.financialServiceProviderRepository.findOne({
        where: { id: id },
        relations: ['questions'],
      });
    if (financialServiceProvider) {
      financialServiceProvider.editableAttributes =
        await this.getPaEditableAttributesFsp(financialServiceProvider.id);
    }
    return financialServiceProvider;
  }

  public async getAllFinancialServiceProviders(): Promise<
    FinancialServiceProviderEntity[]
  > {
    const fsps = await this.financialServiceProviderRepository.find({
      relations: ['questions'],
    });
    for (const fsp of fsps) {
      fsp.editableAttributes = await this.getPaEditableAttributesFsp(fsp.id);
    }
    return fsps;
  }

  // TODO: REFACTOR: What does "PAEditable" mean? Are not all questions editable for...?
  private async getPaEditableAttributesFsp(
    financialServiceProviderId,
  ): Promise<Attribute[]> {
    return (
      await this.financialServiceProviderQuestionRepository.find({
        where: { fspId: financialServiceProviderId },
      })
    ).map((c) => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        options: c.options,
        pattern: c.pattern,
      };
    });
  }

  public async update(
    financialServiceProviderId: number,
    updateFinancialServiceProvderDto: UpdateFinancialServiceProviderDto,
  ): Promise<FinancialServiceProviderEntity> {
    const financialServiceProvider =
      await this.financialServiceProviderRepository.findOne({
        where: { id: financialServiceProviderId },
      });
    if (!financialServiceProvider) {
      const errors = `No fsp found with id ${financialServiceProviderId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (const key in updateFinancialServiceProvderDto) {
      if (key !== 'fsp') {
        financialServiceProvider[key] = updateFinancialServiceProvderDto[key];
      }
    }

    await this.financialServiceProviderRepository.save(
      financialServiceProvider,
    );
    return financialServiceProvider;
  }

  public async updateFinancialServiceProviderQuestion(
    financialServiceProviderId: number,
    attributeName: string,
    updateQuestionDto: UpdateFinancialServiceProviderQuestionDto,
  ): Promise<FspQuestionEntity> {
    const fspAttributes =
      await this.financialServiceProviderQuestionRepository.find({
        where: { name: attributeName },
        relations: ['fsp'],
      });
    // Filter out the right fsp, if fsp-attribute name occurs across multiple fsp's
    const fspAttribute = fspAttributes.find(
      (a) => a.fsp.id === financialServiceProviderId,
    );
    if (!fspAttribute) {
      const errors = `No fspAttribute found with name ${attributeName} in fsp with id ${financialServiceProviderId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (const key in updateQuestionDto) {
      fspAttribute[key] = updateQuestionDto[key];
    }

    await this.financialServiceProviderQuestionRepository.save(fspAttribute);
    return fspAttribute;
  }

  public async createFspAttribute(
    fspId: number,
    fspAttributeDto: CreateFspAttributeDto,
  ): Promise<FspQuestionEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { id: fspId },
    });
    if (!fsp) {
      const errors = `Fsp with id '${fspId}' not found.'`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const fspAttributes =
      await this.financialServiceProviderQuestionRepository.find({
        where: { name: fspAttributeDto.name },
        relations: ['fsp'],
      });
    // Filter out the right fsp, if fsp-attribute name occurs across multiple fsp's
    const oldFspAttribute = fspAttributes.find((a) => a.fsp.id === fspId);
    if (oldFspAttribute) {
      const errors = `Attribute with name ${fspAttributeDto.name} already exists for fsp with id ${fspId}`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    const fspAttribute = new FspQuestionEntity();
    for (const key in fspAttributeDto) {
      fspAttribute[key] = fspAttributeDto[key];
    }
    fspAttribute.fsp = fsp;
    await this.financialServiceProviderQuestionRepository.save(fspAttribute);
    return fspAttribute;
  }

  public async deleteFspAttribute(
    fspId: number,
    attributeName: string,
  ): Promise<FspQuestionEntity> {
    const fspAttribute =
      await this.financialServiceProviderQuestionRepository.findOne({
        where: { name: attributeName, fsp: { id: fspId } },
        relations: ['fsp'],
      });
    if (!fspAttribute) {
      const errors = `Attribute with name: '${attributeName}' not found for fsp with id ${fspId}.'`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return await this.financialServiceProviderQuestionRepository.remove(
      fspAttribute,
    );
  }
}
