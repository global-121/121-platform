import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Parser } from 'expr-eval';
import { Equal, Repository } from 'typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utils/registration-utils.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
@Injectable()
export class InclusionScoreService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
  ) {}

  // TODO: move to different service
  public async calculatePaymentAmountMultiplier({
    paymentAmountMultiplierFormula,
    referenceId,
    programId,
  }: {
    paymentAmountMultiplierFormula: string | null;
    referenceId: string;
    programId: number;
  }): Promise<RegistrationEntity | undefined> {
    const preprocessFormula = (formula: string) =>
      formula.replace(/\$\{([a-zA-Z0-9_]+)\}/g, '$1');

    if (!paymentAmountMultiplierFormula) {
      return;
    }
    const registrations =
      await this.registrationsPaginationService.getRegistrationViewsChunkedByReferenceIds(
        { programId, referenceIds: [referenceId] },
      );
    const registration = registrations[0];

    const valueObject: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(registration)) {
      // if it is a number, pass as number, else as string
      // should we do this based on registration attribute type instead?
      if (value != null) {
        valueObject[key] = !isNaN(Number(value))
          ? Number(value)
          : String(value);
      }
    }
    console.log(
      '🚀 ~ InclusionScoreService ~ calculatePaymentAmountMultiplier ~ numericRegistrationProperties:',
      valueObject,
    );
    const processedFormula = preprocessFormula(paymentAmountMultiplierFormula);
    console.log(
      '🚀 ~ InclusionScoreService ~ calculatePaymentAmountMultiplier ~ processedFormula:',
      processedFormula,
    );
    const parser = new Parser();
    const expr = parser.parse(processedFormula);
    const paymentAmountMultiplier: number = expr.evaluate(valueObject); // result is 3
    console.log(
      '🚀 ~ InclusionScoreService ~ calculatePaymentAmountMultiplier ~ paymentAmountMultiplier:',
      paymentAmountMultiplier,
    );

    await this.registrationScopedRepository.updateUnscoped(
      { referenceId: registration.referenceId },
      { paymentAmountMultiplier },
    );
    return this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: Equal(referenceId) },
    });
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
  ): Promise<object> {
    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: Equal(referenceId) },
      relations: ['data', 'data.programRegistrationAttribute'],
    });
    const scoreList = {};
    for (const entry of registration.data) {
      if (entry.programRegistrationAttribute) {
        const attrValue = entry.value;
        const newKeyName = entry.programRegistrationAttribute.name;
        if (
          entry.programRegistrationAttribute.type ===
          RegistrationAttributeTypes.multiSelect
        ) {
          if (scoreList[newKeyName] !== undefined) {
            scoreList[newKeyName].push(attrValue);
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
    scoreList: object,
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
    answerPA: object,
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
    answerPA: object[],
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
    answerPA: number,
  ): number {
    let score = 0;
    if (programRegistrationAttribute.scoring['multiplier']) {
      if (isNaN(answerPA)) {
        answerPA = 0;
      }
      score =
        Number(programRegistrationAttribute.scoring['multiplier']) * answerPA;
    }
    return score;
  }
}
