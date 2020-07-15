@ho-portal
Feature: Include people affected by Program-manager (extension of Manage_people_affected.feature)

  Background:
    Given a logged-in "program-manager" user
    Given the "active phase" is "review inclusion" or "payment"

  Scenario: View people affected connected to a program
    Given scenario "View people affected connected to a program" in Manage_people_affected.feature
    Then also for each person a "Name" is shown
    And for each person a "Date of birth" is shown
    And for each person an "Included" date+time is shown (if already available)
    And for each person a "Rejected" date+time is shown (if already available)

  Scenario: Use bulk-action "include for program"
    Given the generic "select bulk action" scenario
    When user selects the "include for program" action
    Then the eligible rows are those with status "registered", "selected for validation" and "validated" and "rejected"

  Scenario: Confirm "include for program" action
    Given the generic "confirm apply action" scenario
    When the "bulk action" is "select for validation"
    Then the "changed data" is that the "included" timestamp is filled for the selected rows
    And the "rejected" column remains visible, if it was available
    And the "status" is updated
