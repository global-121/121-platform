import { Component, Input, ViewChildren, QueryList, Output, EventEmitter } from '@angular/core';
import { DialogueTurnComponent } from '../dialogue-turn/dialogue-turn.component';
import { AnswerType, Question, QuestionOption, Answer, AnswerSet } from 'src/app/models/q-and-a.models';

@Component({
  selector: 'q-and-a-set',
  templateUrl: './q-and-a-set.component.html',
  styleUrls: ['./q-and-a-set.component.scss'],
})
export class QAndASetComponent {
  @ViewChildren(DialogueTurnComponent)
  private turns: QueryList<DialogueTurnComponent>;

  @Input()
  public questions: Question[];

  @Input()
  public isSubmitted = false;
  @Output()
  public isSubmittedChange = new EventEmitter<boolean>();

  @Input()
  public isEditing = false;
  @Output()
  public isEditingChange = new EventEmitter<boolean>();

  @Output()
  public submit = new EventEmitter<any>();

  @Input()
  public submitLabel = 'Submit';

  public answers: AnswerSet = {};

  public allQuestionsShown: boolean;

  public answerType = AnswerType;

  constructor() { }

  private getQuestionByCode(questionCode: string): Question {
    const result = this.questions.find((question: Question) => {
      return question.code === questionCode;
    });

    return result;
  }

  private getAnswerOptionLabelByValue(options: QuestionOption[], answerValue: string) {
    const option = options.find((item: QuestionOption) => {
      return item.value === answerValue;
    });

    return option ? option.label : '';
  }

  private createAnswer(question: Question, answerValue: string): Answer {
    const answer: Answer = {
      code: question.code,
      value: answerValue,
      label: answerValue,
    };

    // Convert the answerValue to a human-readable label
    if (question.answerType === AnswerType.Enum) {
      answer.label = this.getAnswerOptionLabelByValue(question.options, answerValue);
    }

    return answer;
  }

  public onAnswerChange(questionCode: string, answerValue: string) {
    const question = this.getQuestionByCode(questionCode);
    const answer = this.createAnswer(question, answerValue);

    // Save answer
    this.answers[questionCode] = answer;

    const answersArray = Object.keys(this.answers);

    this.allQuestionsShown = this.checkAllQuestionsShown(this.questions, answersArray);
    this.showNextQuestion(answersArray.indexOf(questionCode));
  }

  private showNextQuestion(currentIndex: number) {
    const nextIndex = currentIndex + 1;

    this.showTurnByIndex(nextIndex);
  }

  private showTurnByIndex(index: number) {
    const turn = this.turns.toArray()[index];

    if (turn) {
      turn.show();
    }
  }

  private checkAllQuestionsShown(questions: Question[], answers: string[]) {
    return (answers.length >= (questions.length - 1));
  }

  public doSubmit() {
    this.isSubmitted = true;
    this.isSubmittedChange.emit(this.isSubmitted);
    this.isEditing = false;
    this.isEditingChange.emit(this.isEditing);
    this.submit.emit(this.answers);
  }

}
