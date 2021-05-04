@ho-portal
Feature: Invite people affected (extension of Manage_people_affected.feature)

  Background:
    Given a logged-in user with "run program" role
    And the "selected phase" is "registration (& validation)"

  Scenario: Use bulk-action "Invite for registration"
    Given the generic "select bulk action" scenario (see Manage_people_affected.feature)
    When user selects the "Invite for registration" action
    Then the eligible rows are only those with status "Imported"

  Scenario: Confirm "Invite for registration" action
    Given the generic "confirm apply action" scenario (see Manage_people_affected.feature)
    When the "bulk action" is "Invite for registration"
    Then the "changed data" is that the "Invited" timestamp is filled for the selected rows
    And the "status" is updated to "Invited"
    And if the custom SMS option is used, an SMS is sent to the "phoneNumber" (see Manage_people_affected.feature)
