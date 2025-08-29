import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectRegistrationAttributeEntity } from '@121-service/src/projects/project-registration-attribute.entity';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';

@Injectable()
export class InclusionScoreService {
  @InjectRepository(ProjectEntity)
  private readonly projectRepository: Repository<ProjectEntity>;

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly registrationDataService: RegistrationDataService,
  ) {}

  public async calculatePaymentAmountMultiplier(
    project: ProjectEntity,
    referenceId: string,
  ): Promise<RegistrationEntity | undefined> {
    if (!project.paymentAmountMultiplierFormula) {
      return;
    }

    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: Equal(referenceId) },
      relations: ['data'],
    });
    const formulaParts = project.paymentAmountMultiplierFormula
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
      relations: ['project'],
    });

    const scoreList = await this.createQuestionAnswerListPrefilled(referenceId);

    const project = await this.projectRepository.findOneOrFail({
      where: { id: Equal(registration.project.id) },
      relations: ['projectRegistrationAttributes'],
    });
    const score = this.calculateScoreAllProjectAttributes(
      project.projectRegistrationAttributes,
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
      relations: ['data', 'data.projectRegistrationAttribute'],
    });
    const scoreList = {};
    for (const entry of registration.data) {
      if (entry.projectRegistrationAttribute) {
        const attrValue = entry.value;
        const newKeyName = entry.projectRegistrationAttribute.name;
        if (
          entry.projectRegistrationAttribute.type ===
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

  private calculateScoreAllProjectAttributes(
    projectRegistrationAttributes: ProjectRegistrationAttributeEntity[],
    scoreList: object,
  ): number {
    let totalScore = 0;
    for (const attribute of projectRegistrationAttributes) {
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
    projectRegistrationAttribute: ProjectRegistrationAttributeEntity,
    answerPA: object,
  ): number {
    // If attribute has no scoring system return 0;
    if (Object.keys(projectRegistrationAttribute.scoring).length === 0) {
      return 0;
    }
    let score = 0;
    const options = JSON.parse(
      JSON.stringify(projectRegistrationAttribute.options),
    );
    for (const value of options) {
      if (
        value.option == answerPA &&
        projectRegistrationAttribute.scoring[value.option]
      ) {
        score = Number(projectRegistrationAttribute.scoring[value.option]);
      }
    }
    return score;
  }

  private getScoreForMultiSelect(
    projectRegistrationAttribute: ProjectRegistrationAttributeEntity,
    answerPA: object[],
  ): number {
    // If attribute has no scoring system return 0;
    if (Object.keys(projectRegistrationAttribute.scoring).length === 0) {
      return 0;
    }
    let score = 0;
    const options = JSON.parse(
      JSON.stringify(projectRegistrationAttribute.options),
    );
    for (const selectedOption of answerPA) {
      for (const value of options) {
        if (
          value.option == selectedOption &&
          projectRegistrationAttribute.scoring[value.option]
        ) {
          score =
            score + Number(projectRegistrationAttribute.scoring[value.option]);
        }
      }
    }
    return score;
  }

  private getScoreForNumeric(
    projectRegistrationAttribute: ProjectRegistrationAttributeEntity,
    answerPA: number,
  ): number {
    let score = 0;
    if (projectRegistrationAttribute.scoring['multiplier']) {
      if (isNaN(answerPA)) {
        answerPA = 0;
      }
      score =
        Number(projectRegistrationAttribute.scoring['multiplier']) * answerPA;
    }
    return score;
  }
}
