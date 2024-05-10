import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../../programs/program.entity';
import { AnswerTypes } from '../enum/custom-data-attributes';
import { RegistrationDataService } from '../modules/registration-data/registration-data.service';
import { RegistrationUtilsService } from '../modules/registration-utilts/registration-utils.service';
import { RegistrationEntity } from '../registration.entity';
import { RegistrationScopedRepository } from '../repositories/registration-scoped.repository';
import { ProgramQuestionEntity } from './../../programs/program-question.entity';

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
  ): Promise<RegistrationEntity> {
    if (!program.paymentAmountMultiplierFormula) {
      return;
    }

    const registration = await this.registrationScopedRepository.findOne({
      where: { referenceId: referenceId },
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
    const registration = await this.registrationScopedRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['program'],
    });

    const scoreList = await this.createQuestionAnswerListPrefilled(referenceId);

    const program = await this.programRepository.findOne({
      where: { id: registration.program.id },
      relations: ['programQuestions'],
    });
    const score = this.calculateScoreAllProgramQuestions(
      program.programQuestions,
      scoreList,
    );

    registration.inclusionScore = score;

    await this.registrationUtilsService.save(registration);
  }

  private async createQuestionAnswerListPrefilled(
    referenceId: string,
  ): Promise<object> {
    const registration = await this.registrationScopedRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['data', 'data.programQuestion'],
    });
    const scoreList = {};
    for (const entry of registration.data) {
      if (entry.programQuestion) {
        const attrValue = entry.value;
        const newKeyName = entry.programQuestion.name;
        if (entry.programQuestion.answerType === AnswerTypes.multiSelect) {
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

  private calculateScoreAllProgramQuestions(
    programQuestions: ProgramQuestionEntity[],
    scoreList: object,
  ): number {
    let totalScore = 0;
    for (const question of programQuestions) {
      const questionName = question.name;
      if (scoreList[questionName]) {
        const answerPA = scoreList[questionName];
        switch (question.answerType) {
          case AnswerTypes.dropdown:
            totalScore =
              totalScore + this.getScoreForDropDown(question, answerPA);
            break;
          case AnswerTypes.numeric:
            totalScore =
              totalScore + this.getScoreForNumeric(question, answerPA);
            break;
          case AnswerTypes.multiSelect:
            totalScore =
              totalScore + this.getScoreForMultiSelect(question, answerPA);
            break;
        }
      }
    }
    return totalScore;
  }

  private getScoreForDropDown(
    programQuestion: ProgramQuestionEntity,
    answerPA: object,
  ): number {
    // If questions has no scoring system return 0;
    if (Object.keys(programQuestion.scoring).length === 0) {
      return 0;
    }
    let score = 0;
    const options = JSON.parse(JSON.stringify(programQuestion.options));
    for (const value of options) {
      if (value.option == answerPA && programQuestion.scoring[value.option]) {
        score = Number(programQuestion.scoring[value.option]);
      }
    }
    return score;
  }

  private getScoreForMultiSelect(
    programQuestion: ProgramQuestionEntity,
    answerPA: object[],
  ): number {
    // If questions has no scoring system return 0;
    if (Object.keys(programQuestion.scoring).length === 0) {
      return 0;
    }
    let score = 0;
    const options = JSON.parse(JSON.stringify(programQuestion.options));
    for (const selectedOption of answerPA) {
      for (const value of options) {
        if (
          value.option == selectedOption &&
          programQuestion.scoring[value.option]
        ) {
          score = score + Number(programQuestion.scoring[value.option]);
        }
      }
    }
    return score;
  }

  private getScoreForNumeric(
    programQuestion: ProgramQuestionEntity,
    answerPA: number,
  ): number {
    let score = 0;
    if (programQuestion.scoring['multiplier']) {
      if (isNaN(answerPA)) {
        answerPA = 0;
      }
      score = Number(programQuestion.scoring['multiplier']) * answerPA;
    }
    return score;
  }
}
