import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utils/registration-utils.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';

@Injectable()
export class InclusionScoreService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly registrationDataService: RegistrationDataService,
  ) {}

  public async calculatePaymentAmountMultiplier(
    program: ProgramEntity,
    referenceId: string,
  ): Promise<RegistrationEntity | undefined> {
    if (!program.paymentAmountMultiplierFormula) {
      return;
    }

    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: Equal(referenceId) },
      relations: ['data'],
    });
    const formulaParts = program.paymentAmountMultiplierFormula
      .replace(/\s/g, '')
      .split('+');
    const constant = Number(formulaParts[0]);
    formulaParts.shift(); // remove 'constant' from array
    let paymentAmountMultiplier = constant;
    for await (const factor of formulaParts) {
      const factorElements = factor.replace(/\s/g, '').split('*');
      const factorValue =
        await this.registrationDataService.getRegistrationDataValueByName(
          registration,
          factorElements[1],
        );
      paymentAmountMultiplier +=
        Number(factorElements[0]) * Number(factorValue);
    }
    registration.paymentAmountMultiplier = paymentAmountMultiplier;
    return await this.registrationUtilsService.save(registration);
  }

  public async calculateInclusionScore(referenceId: string): Promise<void> {
    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: Equal(referenceId) },
      relations: ['program'],
    });

    const scoreList = await this.createQuestionAnswerListPrefilled(referenceId);

    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(registration.program.id) },
      relations: ['programRegistrationAttributes'],
    });
    const score = this.calculateScoreAllProgramAttributes(
      program.programRegistrationAttributes,
      scoreList,
    );

    registration.inclusionScore = score;

    await this.registrationUtilsService.save(registration);
  }

  private async createQuestionAnswerListPrefilled(
    referenceId: string,
  ): Promise<Record<string, string | string[]>> {
    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: Equal(referenceId) },
      relations: ['data', 'data.programRegistrationAttribute'],
    });
    const scoreList: Record<string, string | string[]> = {};
    for (const entry of registration.data) {
      if (entry.programRegistrationAttribute) {
        const attrValue = entry.value;
        const newKeyName = entry.programRegistrationAttribute.name;
        if (
          entry.programRegistrationAttribute.type ===
          RegistrationAttributeTypes.multiSelect
        ) {
          if (scoreList[newKeyName] !== undefined) {
            (scoreList[newKeyName] as string[]).push(attrValue);
          } else {
            scoreList[newKeyName] = [attrValue];
          }
        } else {
          scoreList[newKeyName] = attrValue;
        }
      }
    }
    return scoreList;
  }

  private calculateScoreAllProgramAttributes(
    programRegistrationAttributes: ProgramRegistrationAttributeEntity[],
    scoreList: Record<string, string | string[]>,
  ): number {
    let totalScore = 0;
    for (const attribute of programRegistrationAttributes) {
      const attributeName = attribute.name;
      if (scoreList[attributeName]) {
        const answerPA = scoreList[attributeName];
        switch (attribute.type) {
          case RegistrationAttributeTypes.dropdown:
            totalScore =
              totalScore + this.getScoreForDropDown(attribute, answerPA);
            break;
          case RegistrationAttributeTypes.numeric:
            totalScore =
              totalScore + this.getScoreForNumeric(attribute, answerPA);
            break;
          case RegistrationAttributeTypes.multiSelect:
            totalScore =
              totalScore + this.getScoreForMultiSelect(attribute, answerPA);
            break;
        }
      }
    }
    return totalScore;
  }

  private getScoreForDropDown(
    programRegistrationAttribute: ProgramRegistrationAttributeEntity,
    answerPA: string | string[],
  ): number {
    // If attribute has no scoring system return 0;
    if (Object.keys(programRegistrationAttribute.scoring).length === 0) {
      return 0;
    }
    let score = 0;
    const options = JSON.parse(
      JSON.stringify(programRegistrationAttribute.options),
    );
    for (const value of options) {
      if (
        value.option == answerPA &&
        programRegistrationAttribute.scoring[value.option]
      ) {
        score = Number(programRegistrationAttribute.scoring[value.option]);
      }
    }
    return score;
  }

  private getScoreForMultiSelect(
    programRegistrationAttribute: ProgramRegistrationAttributeEntity,
    answerPA: string | string[],
  ): number {
    // If attribute has no scoring system return 0;
    if (Object.keys(programRegistrationAttribute.scoring).length === 0) {
      return 0;
    }
    let score = 0;
    const options = JSON.parse(
      JSON.stringify(programRegistrationAttribute.options),
    );
    for (const selectedOption of answerPA) {
      for (const value of options) {
        if (
          value.option == selectedOption &&
          programRegistrationAttribute.scoring[value.option]
        ) {
          score =
            score + Number(programRegistrationAttribute.scoring[value.option]);
        }
      }
    }
    return score;
  }

  private getScoreForNumeric(
    programRegistrationAttribute: ProgramRegistrationAttributeEntity,
    answerPA: string | string[],
  ): number {
    let score = 0;
    if (programRegistrationAttribute.scoring['multiplier']) {
      const numericAnswer = Number(answerPA);
      if (isNaN(numericAnswer)) {
        return 0;
      }
      score =
        Number(programRegistrationAttribute.scoring['multiplier']) *
        numericAnswer;
    }
    return score;
  }
}
