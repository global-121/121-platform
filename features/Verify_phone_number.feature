@PA-App
Feature: Verify phone number

  Scenario: Reject an incorrect submitted phone number
    Given a person affected that entered her phone number
    When this person submits their phone number incorrectly
    Then this person reveives feedback in the interface that the phone number is incorrect
    And this person receives feedback in the interface that she has to correct the phone number

  Scenario: Accept a correct submitted phone number
    Given a person affected that entered her phone number
    When this person submits their phone number correctly
    Then the next section of registration start
