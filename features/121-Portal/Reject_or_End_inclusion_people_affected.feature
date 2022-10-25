@ho-portal
Feature: Reject or end inclusion of people affected (extension of View_and_Manage_people_affected.feature)

  Background:
    Given a logged-in user with "RegistrationStatusRejectedUPDATE" permission
    Given the "selected phase" is the "inclusion" or "payment" phase

  Scenario: View "reject from program" action
    When opening the "action dropdown"
    Then the "reject from program" action is visible

  Scenario: Use bulk-action "reject from program"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "reject from program" action
    Then the eligible rows are those with status "included", "registered", "selected for validation", "validated", "no longer eligible" and "registered while no longer eligible"

  Scenario: Confirm "reject from program" action
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    When the "bulk action" is "reject from program"
    Then the PA is from now on only seeable in the "inclusion" page
    And "rejected" timestamp is filled for the selected rows
    And the "included" column remains filled
    And the "status" is updated to "Rejected"
    And if the custom SMS option is used, an SMS is sent to the PA (see View_and_Manage_people_affected.feature)
    And in the PA-app - after return or refresh - a notification appears that the PA is "not included"

  ------------------------------------------

  Background:
    Given a logged-in user with "RegistrationStatusInclusionEndedUPDATE" permission
    Given the "selected phase" is the "payment" phase

  Scenario: View "end inclusion in program" action
    When opening the "action dropdown"
    Then the "end inclusion in program" action is visible

  Scenario: Use bulk-action "end inclusion in program"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "end inclusion in program" action
    Then the eligible rows are those with status "included"

  Scenario: Confirm "end inclusion in program" action
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    When the "bulk action" is "end inclusion in program"
    Then the PA is from now on only seeable in the "inclusion" page
    And the "end inclusion" timestamp is filled for the selected rows
    And the "included" column remains filled
    And the "status" is updated to "Inclusion ended"
    And if the custom SMS option is used, an SMS is sent to the PA (see View_and_Manage_people_affected.feature)
    And in the PA-app - after return or refresh - a notification appears that the PA is "not included"

  ------------------------------------------

  Scenario: Reject or End inclusion for 2000 PAs
    Given there are 2000 PAs in the system
    And they are included (see e.g. HO-Portal/Include_people_affected_Run_Program_role.feature)
    When the user uses and confirms the "reject from program" or "end inclusion in program" action on all 2000 PAs
    Then this is all processed as in the scenarios above, quickly and without problem

  Scenario: Identify People Affected to Reject based on "Registered while no longer eligible"
    Given there are People Affected which are marked as no longer eligible
    And some of these have completed a registration
    When the user searches in the PA-table for status "Registered while no longer eligible" (either through filtering or sorting + scrolling)
    Then these People Affected should have a filled "Completed Vulnerability Assessment" column
    And a filled "No longer eligible" column
    And these people can subsequently be selected for rejection (see scenarios: 'Use bulk-action "reject from program"' and 'Confirm "reject from program" action')
