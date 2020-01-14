@PA-App
Feature: Fill payment details


  Scenario: Show payment detail questions after choosing a financial service provider succesfully
    Given a person affected that enrolls in a program
    When this person chooses a financial service provider
    Then the corresponding questions are shown
    And the corresponding answer boxes are shown

  Scenario: Store payment details when the person affected succesfully filled them in
    Given a person affected that entered her payment details
    When this person presses "Store FSP details"
    Then the payment details are stored
    And the person receives positive feedback
    And the next section is loaded

  Scenario: Store payment details when the person affected did not fille them in
    Given a person affected that did not enter her payment details
    When this person presses "Store FSP details"
    Then the payment details are not stored
    And the person receives a prompt to fill in her details

