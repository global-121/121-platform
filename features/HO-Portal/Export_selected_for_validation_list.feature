@ho-portal
Feature: Export selected for validation list

  Background:
    Given a program with "validation"
    And the "selected phase" is "registration & validation"

  Scenario: Export selected for validation list
    Given a logged-in user with "personal data" role
    When the user clicks the "export list: selected for validation" and confirms the confirm prompt
    Then an Excel-file is downloaded
    And it shows a list of the registrations that are "selected for validation"
    And it shows the "name" and "phonenumber" to be able to identify people
    And it shows the dates at which the person reached each status, to be able to assess the trajectory towards "selected for validation"
    And the "export list" button remains enabled, so the action can be repeated infinitely
    And if no "selected for validation" registrations then an alert is shown that "no data can be downloaded"

  Scenario: Viewing the export button without access
    Given a logged-in user without the "personal data" role
    When the user views the "registration & validation" page
    Then the "export list: selected for validation" button is disabled
