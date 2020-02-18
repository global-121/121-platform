@ho-portal
Feature: Export payment details

  Scenario: Viewing the export options as privacy-officer
    Given a logged-in "privacy-officer" user
    When the user views the "program-payout" component
    Then the user sees an "export" button per installment
    And this button is only enabled for all "past" installments and the "first open" installment

  Scenario: Export payment details before installment
    Given a logged-in "privacy-officer" user
    Given the installment has not taken place
    When the user clicks the "export list" button of the "open" installment
    Then a csv is downloaded 
    And it shows a list of the connections that are "included"
    And the known "phonenumber"
    And all "persistent data" required by the "government"

  Scenario: Export payment details after installment
    Given a logged-in "privacy-officer" user
    Given the installment has taken place
    When the user clicks the "export list" button of a "closed" installment
    Then a csv is dowloaded 
    And it shows a list of the connections that are "included" 
    And "transaction" information
    And the "installment-number"
    And the known "phonenumber"
    And all "connection.custromData"

  Scenario: Viewing the export options as program-manager
    Given a logged-in "program-manager" user
    When the user views the "program-payout" component
    Then the export list buttton is disabled for all installments
