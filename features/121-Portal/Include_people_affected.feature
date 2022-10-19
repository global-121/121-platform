@ho-portal
Feature: Include people affected

  Background:
    Given a logged-in user with the "RegistrationStatusIncludedUPDATE" permission
    Given the "selected phase" is the "inclusion" phase

  Scenario: View "include for program" action
    When opening the "action dropdown"
    Then the "include for program" action is visible

  Scenario: Use bulk-action "include for program"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "include for program" action
    Then the eligible rows are those with status "registered", "selected for validation", "validated", "rejected" and "inclusion ended"

  Scenario: Confirm "include for program" action
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    When the "bulk action" is "include for program"
    Then the "included" PAs are no longer visible in the "inclusion" page the user is on now, as "included" PAs are viewable in the "payment" page only
    And the "included" timestamp is filled for the selected rows
    And the "rejected" date+time remains visible, if the PA was "rejected" before
    And the "inclusion ended" date+time remains visible, if the PA had status "inclusion ended" before
    And the "status" is updated to "Included"
    And if the custom SMS option is used, an SMS is sent to the PA (see View_and_Manage_people_affected.feature)
    And in the PA-app a notification appears that the PA is included

  Scenario: Include 2000 PAs
    Given there are 2000 "registered" PAs in the syste m
    When the user uses and confirms the "include for program" action on all 2000 PAs
    Then this is all processed as in the scenario above, quickly and without problem






