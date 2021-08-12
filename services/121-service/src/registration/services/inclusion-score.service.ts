import { ProgramQuestionEntity } from './../../programs/program/program-question.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProgramEntity } from '../../programs/program/program.entity';
import { Repository } from 'typeorm';
import { RegistrationEntity } from '../registration.entity';

@Injectable()
export class InlusionScoreService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  public constructor() {}

  public async calculateInclusionScore(referenceId: string): Promise<void> {
    let registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['program'],
    });
    console.log('registration: ', registration);

    const scoreList = await this.createQuestionAnswerListPrefilled(
      referenceId,
      registration.program.id,
    );

    let program = await this.programRepository.findOne(
      registration.program.id,
      {
        relations: ['programQuestions'],
      },
    );
    const score = this.calculateScoreAllCriteria(
      program.programQuestions,
      scoreList,
    );

    registration.inclusionScore = score;

    await this.registrationRepository.save(registration);
  }

  private async createQuestionAnswerListPrefilled(
    referenceId: string,
    programId: number,
  ): Promise<object> {
    const registration = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
      relations: ['programAnswers', 'programAnswers.programQuestion'],
    });
    const scoreList = {};
    for (let prefilledAnswer of registration.programAnswers) {
      let attrValue = prefilledAnswer.programAnswer;
      let newKeyName = prefilledAnswer.programQuestion.name;
      scoreList[newKeyName] = attrValue;
    }
    return scoreList;
  }

  private calculateScoreAllCriteria(
    programQuestions: ProgramQuestionEntity[],
    scoreList: object,
  ): number {
    let totalScore = 0;
    for (let question of programQuestions) {
      let questionName = question.name;
      if (scoreList[questionName]) {
        let answerPA = scoreList[questionName];
        switch (question.answerType) {
          case 'dropdown': {
            totalScore =
              totalScore + this.getScoreForDropDown(question, answerPA);
          }
          case 'numeric':
            totalScore =
              totalScore + this.getScoreForNumeric(question, answerPA);
        }
      }
    }
    return totalScore;
  }

  private getScoreForDropDown(
    criterium: ProgramQuestionEntity,
    answerPA: object,
  ): number {
    // If questions has no scoring system return 0;
    if (Object.keys(criterium.scoring).length === 0) {
      return 0;
    }
    let score = 0;
    const options = JSON.parse(JSON.stringify(criterium.options));
    for (let value of options) {
      if (value.option == answerPA) {
        score = criterium.scoring[value.option];
      }
    }
    return score;
  }

  private getScoreForNumeric(
    criterium: ProgramQuestionEntity,
    answerPA: number,
  ): number {
    let score = 0;
    if (criterium.scoring['multiplier']) {
      if (isNaN(answerPA)) {
        answerPA = 0;
      }
      score = criterium.scoring['multiplier'] * answerPA;
    }
    return score;
  }
}
