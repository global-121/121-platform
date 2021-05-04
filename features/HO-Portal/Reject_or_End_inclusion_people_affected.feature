@ho-portal
Feature: Reject or end inclusion of people affected (extension of Manage_people_affected.feature)

  Background:
    Given a logged-in user with "personal data" role
    Given the "active phase" is "review inclusion" or "payment"

  Scenario: View people affected connected to a program
    Given scenario "View people affected connected to a program" in Manage_people_affected.feature
    Then also for each person a "Name" is shown
    And for each person the other "personal data attributes" connected to this program are shown ("Phone number", ...) 
    And for each person the chosen "Financial Service Provider" is shown
    And for each person an "Included" date+time is shown (if already available)
    And for each person a "Rejected" date+time is shown (if already available)
    And for each person a "Inclusion ended" date+time is shown (if already available)

  Scenario: Use bulk-action "reject from program"
    Given the generic "select bulk action" scenario (see Manage_people_affected.feature)
    When user selects the "reject from program" action
    Then the eligible rows are those with status "included"

  Scenario: Confirm "reject from program" action
    Given the generic "confirm apply action" scenario (see Manage_people_affected.feature)
    When the "bulk action" is "reject from program"
    Then the "changed data" is that the "rejected" timestamp is filled for the selected rows
    And the "included" column remains filled
    And the "status" is updated to "Rejected"
    And if the custom SMS option is used, an SMS is sent to the PA (see Manage_people_affected.feature)
    And in the PA-app - after return or refresh - a notification appears that the PA is "not included"
  
  Scenario: Use bulk-action "end inclusion in program"
    Given the generic "select bulk action" scenario (see Manage_people_affected.feature)
    When user selects the "end inclusion in program" action
    Then the eligible rows are those with status "included"

  Scenario: Confirm "end inclusion in program" action
    Given the generic "confirm apply action" scenario (see Manage_people_affected.feature)
    When the "bulk action" is "end inclusion in program"
    Then the "changed data" is that the "end inclusion" timestamp is filled for the selected rows
    And the "included" column remains filled
    And the "status" is updated to "Inclusion ended"
    And if the custom SMS option is used, an SMS is sent to the PA (see Manage_people_affected.feature)
    And in the PA-app - after return or refresh - a notification appears that the PA is "not included"
