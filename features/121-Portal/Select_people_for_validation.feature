@ho-portal
Feature: Select people affected for validation (extension of View_and_Manage_people_affected.feature)

  Background:
    Given a logged-in user with "RegistrationStatusSelectedForValidationUPDATE" permission
    Given a program with "validation"
    Given the "active phase" is "registration & validation"

  Scenario: View the "select for validation" action
    Given a program with "validation"
    When the user views the bulk actions list
    Then the "select for validation" action is available

  Scenario: Use bulk-action "select for validation"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "select for validation" action
    Then the eligible rows are only those with status "Registered"

  Scenario: Confirm "select for validation" action
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    When the "bulk action" is "select for validation"
    Then the "changed data" is that the "selected for validation" timestamp is filled for the selected rows
    And the "status" is updated to "Selected for validation"
