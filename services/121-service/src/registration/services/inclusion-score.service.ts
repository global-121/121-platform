import { ProgramQuestionEntity } from './../../programs/program-question.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProgramEntity } from '../../programs/program.entity';
import { Repository } from 'typeorm';
import { RegistrationEntity } from '../registration.entity';
import { AnswerTypes } from '../enum/custom-data-attributes';

@Injectable()
export class InlusionScoreService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  public constructor() {}

  public async calculatePaymentAmountMultiplier(
    programId: number,
    referenceId: string,
  ): Promise<RegistrationEntity> {
    const program = await this.programRepository.findOne(programId);
    if (!program.paymentAmountMultiplierFormula) {
      return;
    }
    const registration = await this.registrationRepository.findOne({
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
        registration.getRegistrationDataByName[factorElements[1]];
      paymentAmountMultiplier += Number(factorElements[0]) * factorValue;
    }
    registration.paymentAmountMultiplier = paymentAmountMultiplier;
    return await this.registrationRepository.save(registration);
  }

  public async calculateInclusionScore(referenceId: string): Promise<void> {
    let registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['program'],
    });

    const scoreList = await this.createQuestionAnswerListPrefilled(referenceId);

    let program = await this.programRepository.findOne(
      registration.program.id,
      {
        relations: ['programQuestions'],
      },
    );
    const score = this.calculateScoreAllProgramQuestions(
      program.programQuestions,
      scoreList,
    );

    registration.inclusionScore = score;

    await this.registrationRepository.save(registration);
  }

  private async createQuestionAnswerListPrefilled(
    referenceId: string,
  ): Promise<object> {
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['data', 'data.programQuestion'],
    });
    const scoreList = {};
    for (let entry of registration.data) {
      if (entry.programQuestion) {
        let attrValue = entry.value;
        let newKeyName = entry.programQuestion.name;
        scoreList[newKeyName] = attrValue;
      }
    }
    return scoreList;
  }

  private calculateScoreAllProgramQuestions(
    programQuestions: ProgramQuestionEntity[],
    scoreList: object,
  ): number {
    let totalScore = 0;
    for (let question of programQuestions) {
      let questionName = question.name;
      if (scoreList[questionName]) {
        let answerPA = scoreList[questionName];
        switch (question.answerType) {
          case AnswerTypes.dropdown: {
            totalScore =
              totalScore + this.getScoreForDropDown(question, answerPA);
          }
          case AnswerTypes.numeric:
            totalScore =
              totalScore + this.getScoreForNumeric(question, answerPA);
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
    for (let value of options) {
      if (value.option == answerPA && programQuestion.scoring[value.option]) {
        score = programQuestion.scoring[value.option];
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
      score = programQuestion.scoring['multiplier'] * answerPA;
    }
    return score;
  }
}
