@ho-portal
Feature: Include people affected by "run program" role (extension of Manage_people_affected.feature)

  Background:
    Given a logged-in user with the "run program" role
    Given the "active phase" is "inclusion"

  Scenario: View people affected connected to a program
    Given scenario "View people affected connected to a program" in Manage_people_affected.feature
    Then also for each person an "Inclusion Score" is shown
    And for each person an "Included" date+time is shown (if already available)

  Scenario: Use bulk-action "include for program"
    Given the generic "select bulk action" scenario (see Manage_people_affected.feature)
    When user selects the "include for program" action
    Then the eligible rows are those with status "registered", "selected for validation" and "validated"

  Scenario: Confirm "include for program" action
    Given the generic "confirm apply action" scenario (see Manage_people_affected.feature)
    When the "bulk action" is "include for program"
    Then the "changed data" is that the "included" timestamp is filled for the selected rows
    And the "status" is updated to "Included"
    And if the custom SMS option is used, an SMS is sent to the PA (see Manage_people_affected.feature)
    And in the PA-app a notification appears that the PA is included
  
  Scenario: Include 2000 PAs
    Given there are 2000 "registered" PAs in the system (see Admin-user/Import_test_registrations_NL.feature)
    When the user uses and confirms the "include for program" action on all 2000 PAs
    Then this is all processed as in the scenario above, quickly and without problem 
