@ho-portal
Feature: Export payment details

  Scenario: Viewing the export options as program-manager
    Given a logged-in "program-manager" user
    When the user views the "payment" page
    Then the user sees an "Export payment details" component
    And the dropdown contains a list of all payments, with number, "open" or "closed" and date

  Scenario: Export payment details before payment
    Given a logged-in "program-manager" user
    Given the payment has not taken place
    When the user selects the first "open" payment from the dropdown-list
    Then the "export list" button is enabled
    When the user clicks the "export list" button
    Then a CSV-file is downloaded
    And it shows a list of the connections that are "included"
    And the known "phonenumber"
    And all "persistent data"

  Scenario: Export payment details after payment
    Given a logged-in "program-manager" user
    Given the payment has taken place
    When the user selects an "closed" payment from the dropdown-list
    Then the "export list" button is enabled
    When the user clicks the "export list" button
    Then a CSV-file is dowloaded
    And it shows a list of the connections that are "included"
    And "transaction" information
    And the "installment-number"
    And the known "phonenumber"
    And all "connection.customData"

  Scenario: No "included" connections
    Given a logged-in "program-manager" user
    Given the installment has taken place
    When the user selects a "closed" payment from the dropdown-list
    Then the "export list"-button is disabled

  Scenario: Viewing the export options as project-officer
    Given a logged-in "project-officer" user
    When the user views the "payment" page
    Then the "Export payment details" component is not visible
