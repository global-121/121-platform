import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from '../registration/enum/custom-data-attributes';
import {
  CreateFspAttributeDto,
  UpdateFinancialServiceProviderAttributeDto,
  UpdateFspDto,
} from './dto/update-financial-service-provider.dto';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { FinancialServiceProviderAttributeEntity } from './financial-service-provider-attribute.entity';

@Injectable()
export class FinancialServiceProvidersService {
  @InjectRepository(FinancialServiceProviderEntity)
  private financialServiceProviderRepository: Repository<FinancialServiceProviderEntity>;
  @InjectRepository(FinancialServiceProviderAttributeEntity)
  public fspAttributeRepository: Repository<FinancialServiceProviderAttributeEntity>;

  public async getFspById(id: number): Promise<FinancialServiceProviderEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { id: id },
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
    return (
      await this.fspAttributeRepository.find({
        where: { fspId: fspId },
      })
    ).map((c) => {
      return {
        name: c.name,
        type: c.answerType,
        label: c.label,
        shortLabel: c.shortLabel,
        options: c.options,
      };
    });
  }

  public async updateFsp(
    fspId: number,
    updateFspDto: UpdateFspDto,
  ): Promise<FinancialServiceProviderEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { id: fspId },
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
    fspAttributeDto: UpdateFinancialServiceProviderAttributeDto,
  ): Promise<FinancialServiceProviderAttributeEntity> {
    const fspAttributes = await this.fspAttributeRepository.find({
      where: { name: attributeName },
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
  ): Promise<FinancialServiceProviderAttributeEntity> {
    const fsp = await this.financialServiceProviderRepository.findOne({
      where: { id: fspId },
    });
    if (!fsp) {
      const errors = `Fsp with id '${fspId}' not found.'`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const fspAttributes = await this.fspAttributeRepository.find({
      where: { name: fspAttributeDto.name },
      relations: ['fsp'],
    });
    // Filter out the right fsp, if fsp-attribute name occurs across multiple fsp's
    const oldFspAttribute = fspAttributes.find((a) => a.fsp.id === fspId);
    if (oldFspAttribute) {
      const errors = `Attribute with name ${fspAttributeDto.name} already exists for fsp with id ${fspId}`;
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    const fspAttribute = new FinancialServiceProviderAttributeEntity();
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
  ): Promise<FinancialServiceProviderAttributeEntity> {
    const fspAttribute = await this.fspAttributeRepository.findOne({
      where: { name: attributeName, fsp: { id: fspId } },
      relations: ['fsp'],
    });
    if (!fspAttribute) {
      const errors = `Attribute with name: '${attributeName}' not found for fsp with id ${fspId}.'`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return await this.fspAttributeRepository.remove(fspAttribute);
  }
}
