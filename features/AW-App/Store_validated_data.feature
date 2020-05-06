@aw-app
Feature: Get PA attributes for

  Background:
    Given a logged-in "aidworker" user
    Given the user successfully got the validation data of a PA

  Scenario: Storing a program credential
    Given the user presses 'store program credential'
    When the did is stored
    Then the message: 'The Program credential has been created. Please make sure to upload it when internet is available.' is shown
    And the main menu is shown
