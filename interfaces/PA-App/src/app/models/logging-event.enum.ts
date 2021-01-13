export enum LoggingEventCategory {
  progress = 'progress',
  input = 'input',
  ui = 'UI',
  error = 'error',
}

export enum LoggingEvent {
  audioPause = 'audio-pause',
  audioPlay = 'audio-play',
  error = 'error',
  exception = 'exception',
  languageChosen = 'language-chosen',
  passwordInputToggle = 'password-input-toggle',
  passwordNotEqual = 'password-not-equal',
  passwordNotValid = 'password-not-valid',
  popUpOpen = 'pop-up-open',
  qaAnswerNotValid = 'qa-answer-not-valid',
  qaQuestionShown = 'qa-question-shown',
  sectionCompleted = 'section-completed',
  usernameNotUnique = 'username-not-unique',
}
