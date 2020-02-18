@ho-portal
Feature: Export payment details

  Scenario: Export payment details after installment
    Given a logged-in "privacy officer" user
    Given the installment has not taken place
    When the user clicks the "export list" button of a finished installment
    Then a csv is dowloaded of the connections that received aid of that installment with "transaction" information
    And the known "phonenumber"
    And all "connection.custromData"

  Scenario: Export payment details after installment
    Given a logged-in "privacy officer" user
    Given the installment has taken place
    When the user clicks the "export list" button
    Then a csv is dowloaded of the connections that are "included" with "transaction" information
    And the known "phonenumber"
    And all "connection.custromData"

  Scenario: Export payment details after installment
    Given a logged-in "privacy officer" user
    When the user views the page "program-details"
    Then the export list buttton is disabled
