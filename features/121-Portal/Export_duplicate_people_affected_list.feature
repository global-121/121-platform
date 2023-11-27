@portal
Feature: Export duplicate people affected list

  Background:
    Given a logged-in user with "RegistrationPersonalEXPORT" permission
    Given the "selected phase" is the "registration" phase

  Scenario: Export duplicate people affected list
    When the user clicks the "export duplicate people affected" and confirms the confirm prompt
    Then an Excel-file is downloaded
    And it shows a list of the registrations that have any of the columns marked with "duplicateCheck" in common
    And it shows the "name" and other attributes to be able to identify people
    And the "export duplicate people affected" button remains enabled, so the action can be repeated
    And if no "duplicate people affected" registrations are found then an alert is shown that "no data can be downloaded"

  Scenario: Viewing the export options without permission
    Given a logged-in does not have the "RegistrationPersonalEXPORT" permission
    When the user views the "registration" page
    Then the export list button is not visible
