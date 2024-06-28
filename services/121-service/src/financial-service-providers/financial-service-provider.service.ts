import {
  CreateFspAttributeDto,
  UpdateFinancialServiceProviderDto,
  UpdateFspAttributeDto,
} from '@121-service/src/financial-service-providers/dto/update-financial-service-provider.dto';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { Attribute } from '@121-service/src/registration/enum/custom-data-attributes';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

@Injectable()
export class FinancialServiceProvidersService {
  @InjectRepository(FinancialServiceProviderEntity)
  private financialServiceProviderRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(FspQuestionEntity)
  public fspAttributeRepository: Repository<FspQuestionEntity>;

  public async getFspById(id: number): Promise<FinancialServiceProviderEntity> {
    const fsp = await this.financialServiceProviderRepository.findOneOrFail({
      where: { id: Equal(id) },
      relations: ['questions'],
    });
    if (fsp) {
      fsp.editableAttributes = await this.getPaEditableAttributesFsp(fsp.id);
    }
    return fsp;
  }

  public async getAllFsps(): Promise<FinancialServiceProviderEntity[]> {
    const fsps = await this.financialServiceProviderRepository.find({
      relations: ['questions'],
    });
    for (const fsp of fsps) {
      fsp.editableAttributes = await this.getPaEditableAttributesFsp(fsp.id);
    }
    return fsps;
  }

  private async getPaEditableAttributesFsp(fspId): Promise<Attribute[]> {
    const fspAttributes = await this.fspAttributeRepository.find({
      where: { fspId: Equal(fspId) },
    });

    const attrs = fspAttributes.map((c) => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        options: c.options,
        pattern: c.pattern,
      };
    });

    return attrs;
  }

  public async updateFsp(
    fspId: number,
    updateFspDto: UpdateFinancialServiceProviderDto,
  ): Promise<FinancialServiceProviderEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { id: Equal(fspId) },
    });
    if (!fsp) {
      const errors = `No fsp found with id ${fspId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (const key in updateFspDto) {
      if (key !== 'fsp') {
        fsp[key] = updateFspDto[key];
      }
    }

    await this.financialServiceProviderRepository.save(fsp);
    return fsp;
  }

  public async updateFspAttribute(
    fspId: number,
    attributeName: string,
    fspAttributeDto: UpdateFspAttributeDto,
  ): Promise<FspQuestionEntity> {
    const fspAttributes = await this.fspAttributeRepository.find({
      where: { name: Equal(attributeName) },
      relations: ['fsp'],
    });
    // Filter out the right fsp, if fsp-attribute name occurs across multiple fsp's
    const fspAttribute = fspAttributes.find((a) => a.fsp.id === fspId);
    if (!fspAttribute) {
      const errors = `No fspAttribute found with name ${attributeName} in fsp with id ${fspId}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (const key in fspAttributeDto) {
      fspAttribute[key] = fspAttributeDto[key];
    }

    await this.fspAttributeRepository.save(fspAttribute);
    return fspAttribute;
  }

  public async createFspAttribute(
    fspId: number,
    fspAttributeDto: CreateFspAttributeDto,
  ): Promise<FspQuestionEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { id: Equal(fspId) },
    });
    if (!fsp) {
      const errors = `Fsp with id '${fspId}' not found.'`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const fspAttributes = await this.fspAttributeRepository.find({
      where: { name: Equal(fspAttributeDto.name) },
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
    await this.fspAttributeRepository.save(fspAttribute);
    return fspAttribute;
  }

  public async deleteFspAttribute(
    fspId: number,
    attributeName: string,
  ): Promise<FspQuestionEntity> {
    const fspAttribute = await this.fspAttributeRepository.findOne({
      where: {
        name: Equal(attributeName),
        fsp: { id: Equal(fspId) },
      },
      relations: ['fsp'],
    });
    if (!fspAttribute) {
      const errors = `Attribute with name: '${attributeName}' not found for fsp with id ${fspId}.'`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return await this.fspAttributeRepository.remove(fspAttribute);
  }
}
