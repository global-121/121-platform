@portal
Feature: Include people affected

  Background:
    Given a logged-in user with the "RegistrationStatusIncludedUPDATE" permission
    Given the "selected phase" is the "inclusion" or "payment" phase

  Scenario: View "include in program" action
    When opening the "action dropdown"
    Then the "include in program" action is visible

  Scenario: Use bulk-action "include in program"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "include in program" action
    Then the eligible rows are those with status "registered", "selected for validation", "validated", "rejected", "inclusion ended" and "paused" (in "inclusion phase") or "completed" (in "payment" phase)

  Scenario: Confirm "include in program" action
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    When the "bulk action" is "include in program"
    Then the "included" PAs are no longer visible in the "inclusion" page the user is on now, as "included" PAs are viewable in the "payment" page only
    And the "status" is updated to "Included"
    And if a templated message is present or the custom SMS option is used, an SMS is sent to the PA (see View_and_Manage_people_affected.feature)

  Scenario: Include 10000 PAs
    Given there are 10000 "registered" PAs in the system
    When the user uses and confirms the "include in program" action on all 10000 PAs
    Then this is all processed as in the scenario above, quickly and without problem






