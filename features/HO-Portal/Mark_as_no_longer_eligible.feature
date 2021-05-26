@ho-portal
Feature: Mark Person Affected as no longer eligible (extension of Manage_people_affected.feature)

  Background:
    Given a logged-in user with "run program" role
    And the "active phase" is "registration & validation"

  Scenario: Use bulk-action "mark as no longer eligible"
    Given the generic "select bulk action" scenario (see Manage_people_affected.feature)
    When user selects the "mark as no longer eligible" action
    Then the eligible rows are those with status "Imported" and "Invited"

  Scenario: Confirm "mark as no longer eligible" action
    Given the generic "confirm apply action" scenario (see Manage_people_affected.feature)
    When the "bulk action" is "mark as no longer eligible"
    Then the "changed data" is that the "no longer eligible" timestamp is filled for the selected rows
    And the "status" is updated to "No longer eligible"
