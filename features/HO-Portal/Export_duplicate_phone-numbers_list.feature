@ho-portal
Feature: Export duplicate phone-numbers list

  Background:
    Given a logged-in user with "personal data" role
    Given the "selected phase" is the "review inclusion" phase

  Scenario: Export duplicate phone-numbers list
    When the user clicks the "export duplicate phone-numbers list" and confirms the confirm prompt
    Then a CSV-file is downloaded
    And it shows a list of the connections that have "any phone-number in common"
    And it shows the "name" and other attributes to be able to identify people
    And the "export duplicate phone-numbers list" button remains enabled, so the action can be repeated
    And if no "duplicate phone-number" connections are found then an alert is shown that "no data can be downloaded"

  Scenario: Viewing the export options without permission
    Given a logged-in does not have the "personal data" role
    When the user views the "review inclusion" page
    Then the export list button is disabled
