@ho-portal
Feature: Export People Affected list

  Background:
    Given a logged-in user with "RegistrationPersonalEXPORT" permission
    And the "selected phase" is the "registration" phase

  Scenario: Export People Affected list
    When the user clicks the "export people affected" button and confirms the confirm prompt
    Then an Excel-file is downloaded
    And it shows a list of all People Affected that are also in the PA-table, irrespective of status
    And it shows the "name" and other dynamic program-attributes, that are also in the PA-table
    And it shows "id" and other generic attributes, that are also in the PA-table
    And it does not show any attributes that are not directly visible in the PA-table, such as "note"
    And it shows all program questions which have "all-people-affected" as "export" attribute
    And it shows all program custom attributes which have "all-people-affected" as "export" attribute
    And it does not show any payment-information
    And any columns that only contain null-values are automatically filtered out

  Scenario: Export inclusion list with 5000 PAs
    Given there are 5000 PAs in the system (see Admin-user/Import_test_registrations_NL.feature)
    When the user clicks the "export people affected" and confirms the confirm prompt
    Then an Excel-file is downloaded as in the scenario above quickly and without problem

  Scenario: Viewing the export options without permission
    Given a logged-in user does not have the "RegistrationPersonalEXPORT" permission
    When the user views the "registration" page
    Then the export list button is not visible
