@portal
Feature: Export People Affected list

  Background:
    Given a logged-in user with "RegistrationPersonalEXPORT" permission
    And the "selected phase" is the "registration" phase

  Scenario: Export People Affected list
    When the user clicks the "export people affected" button and confirms the confirm prompt
    Then an Excel-file is downloaded
    And it shows a list of all People Affected
    And - if program and user have scope - then it contains only registrations within the scope of the user
    And it shows the "name" and other dynamic program-attributes, that are also in the PA-table
    And it shows "id" and other generic attributes, that are also in the PA-table
    And it does not show any attributes that are not directly visible in the PA-table, such as "note"
    And it shows all program registration attributes which have "all-people-affected" as "export" attribute
    And any columns that only contain null-values are automatically filtered out

  Scenario: Export inclusion list with 15000 PAs
    Given there are 15000 PAs in the system
    When the user clicks the "export people affected" and confirms the confirm prompt
    Then an Excel-file is downloaded as in the scenario above quickly and without problem

  Scenario: Viewing the export options without permission
    Given a logged-in user does not have the "RegistrationPersonalEXPORT" permission
    When the user views the "registration" page
    Then the export list button is not visible
