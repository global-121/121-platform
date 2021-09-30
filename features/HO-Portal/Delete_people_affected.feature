@ho-portal
Feature: Delete people affected (extension of Manage_people_affected.feature)

  Background:
    Given a logged-in user with "run program" role
    And a program with "validation"
    And the "active phase" is "registration","inclusion","review inclusion" and "payment"

  Scenario: Use bulk-action "delete PA"
    Given the generic "select bulk action" scenario (see Manage_people_affected.feature)
    When user selects the "delete PA" action
    Then the eligible rows are those with status "checkbox" at the beginning of the rows

  Scenario: Confirm "delete PA" action
    Given the generic "confirm apply action" scenario (see Manage_people_affected.feature)
    When the "bulk action" is "delete PA"
    Then the "Pop up" for sending a message will open up
    When the "Message" is entered and triggered "Ok"
    And the "selected PA's" will be sent an "SMS" and will be "deleted"
