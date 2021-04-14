@ho-portal
Feature: Include people affected by Project-officer (extension of Manage_people_affected.feature)

  Background:
    Given a logged-in "project-officer" user
    Given the "active phase" is "inclusion"

  Scenario: View people affected connected to a program
    Given scenario "View people affected connected to a program" in Manage_people_affected.feature
    Then also for each person an "Inclusion Score" is shown
    And for each person an "Included" date+time is shown (if already available)

  Scenario: Use bulk-action "include for program"
    Given the generic "select bulk action" scenario
    When user selects the "include for program" action
    Then the eligible rows are those with status "registered", "selected for validation" and "validated"

  Scenario: Confirm "include for program" action
    Given the generic "confirm apply action" scenario
    When the "bulk action" is "select for validation"
    Then the "changed data" is that the "included" timestamp is filled for the selected rows
    And the "status" is updated
