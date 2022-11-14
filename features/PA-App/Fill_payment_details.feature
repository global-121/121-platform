@pa-app
Feature: Fill payment details

  Background:
    Given the PA is at the "select financial service provider"-step
    Given a list of financial service providers is shown


  Scenario: Show (any) questions after choosing a financial service provider
    When the PA selects a financial service provider from the list
    Then the corresponding questions are shown
    And the corresponding answer inputs are shown

  Scenario Outline: Show specified questions after choosing a financial service provider
    When the PA selects a "<TYPE>" financial service provider from the list
    Then a question of type "<QUESTION-TYPE>" is shown
    And a "<ANSWER-TYPE>"-input is shown

    Examples:
      | TYPE          | QUESTION-TYPE  | ANSWER-TYPE |
      | mobile-money  | Phone-number   | tel         |
      | bank          | Open (default) | text field  |
      | no-attributes | -              | -           |

  Scenario: Store payment details when filled in
    Given the PA selects a financial service provider from the list
    Given the PA fills in the questions shown
    When the PA presses "Store FSP details"
    Then the payment details are stored
    And a positive feedback message is shown

  Scenario: Store payment details when the person affected did not fill them in
    Given the PA selects a financial service provider from the list
    Given the PA does not fill in the questions shown
    When the PA presses "Store FSP details"
    Then the payment details are not stored
    And a prompt to fill the details is shown
