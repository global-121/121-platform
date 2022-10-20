@ho-portal
Feature: Select people affected for validation (extension of View_and_Manage_people_affected.feature)

  Background:
    Given a logged-in user
    And a program with "validation"
    And the "active phase" is "registration & validation"

  Scenario: View people affected connected to a program
    Given scenario "View people affected connected to a program" in View_and_Manage_people_affected.feature
    Then also for each person a "Created Digital ID" date+time is shown
    And for each person a "Completed Vulnerability Assessment" date+time is shown (if already available)
    And for each person an "Inclusion Score" is shown (if already available)
    And for each person a "Selected for validation" date+time is shown (if already available)
    And for each person a "Validated Vulnerability Assessment " date+time is shown (if already available)

Background:
  Given a logged-in user with "RegistrationStatusSelectedForValidationUPDATE" permission
  Then the "select for validation" action is visible

  Scenario: Use bulk-action "select for validation"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "select for validation" action
    Then the eligible rows are those with status "Registered"

  Scenario: Confirm "select for validation" action
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    When the "bulk action" is "select for validation"
    Then the "changed data" is that the "selected for validation" timestamp is filled for the selected rows
    And the "status" is updated to "Selected for validation"
