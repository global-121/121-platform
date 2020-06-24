@ho-portal
Feature: Export payment details

  Scenario: Viewing the export options as program-manager
    Given a logged-in "program-manager" user
    When the user views the "review inclusion" page
    Then the user sees an "export inclusion list" button per installment
    And this button is only enabled when the "review inclusion" phase is the "active" phase

  Scenario: Export inclusion list
    When the user clicks the "export inclusion list" and confirms the confirm prompt
    Then a csv is downloaded 
    And it shows a list of the connections that are "included"
    And it shows the "name" and "dob" to be able to identify people
    And it shows the dates at which the person reached each status, to be able to assess the trajectory towards inclusion
    And the "export inclusion list" button remains enabled, so the action can be repeated infinitely

  Scenario: Viewing the export options as project-officer
    Given a logged-in "project-officer" user
    When the user views the "review inclusion" page
    Then the export list buttton is disabled
