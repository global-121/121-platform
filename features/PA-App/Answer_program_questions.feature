@pa-app
Feature: Answer program questions

  Background:
    Given the PA is at the "enroll in a program"-step


  Scenario Outline: Show specified questions
    When a question of type "<QUESTION-TYPE>" is shown
    Then an "<ANSWER-TYPE>"-input is shown

    Examples:
      | QUESTION-TYPE   | ANSWER-TYPE   |
      | Open (default)  | text field    |
      | Number          | number field  |
      | Phone-number    | tel field     |
      | Date            | date picker   |
      | Multiple choice | radio-buttons |
      | Multi select    | checkboxes    |


  Scenario Outline: Answer "Open (default)" question
    Given the PA needs to answer an "Open (default)" question
    When the PA enters "ANSWER-VALUE" into the input
    Then a feedback message of "FEEDBACK-TYPE" is shown
    And the PA is able to "CONTINUE?"

    Examples:
      | ANSWER-VALUE            | FEEDBACK-TYPE            | CONTINUE? |
      | "test"                  | none                     | yes       |
      | "a test sentence"       | none                     | yes       |
      | "  whitespace around  " | none                     | yes       |
      | "  " (only whitespace)  | "input required" message | no        |
      | "" (empty)              | "input required" message | no        |


  Scenario Outline: Answer "Number" question
    Given the PA needs to answer an "Number" question
    When the PA enters "ANSWER-VALUE" into the input
    Then a feedback message of "FEEDBACK-TYPE" is shown
    And the PA is able to "CONTINUE?"

    Examples:
      | ANSWER-VALUE           | FEEDBACK-TYPE         | CONTINUE? |
      | "0"                    | none                  | yes       |
      | "123"                  | none                  | yes       |
      | "12 34 56"             | "number only" message | no        |
      | "123abc"               | "number only" message | no        |
      | "abc"                  | "number only" message | no        |
      | "  " (only whitespace) | "number only" message | no        |
      | "" (empty)             | "number only" message | no        |
  
  Scenario Outline: Answer "Multi select" question
    When the PA needs to answer a "Multi select" question
    Then it should always included "none" as one of the options
    And at least one option is required to be able to continue to the next question
    And - for now - there is no validation on selecting both 'none' and (at least) one other option

  Scenario: Answer all questions
    Given the PA has seen all questions
    Given the PA has filled in all answers
    When the PA answers the last question
    Then a "save information" submit-button is shown
    When the PA presses "save information"
    Then a "summary of questions and answers" is shown
    And the answer input-fields are disabled
    And a "submit information" submit-button is shown
    And a "change information" button is shown

  Scenario: Submit all answered questions
    Given the PA has seen all questions
    Given the PA has filled in all answers
    Given the PA presses "save information"
    Given the PA presses "submit information"
    Then the answers are send to the API
    And a positive feedback message is shown

  Scenario: Change answered questions
    Given the PA has seen all questions
    Given the PA has filled in all answers
    Given the PA presses "save information"
    Given the PA presses "change information"
    Then the "summary of questions and answers" is removed
    And the "save information" submit-button is shown
    And the answer input-fields are enabled
