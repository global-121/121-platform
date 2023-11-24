@portal

Feature: Change password

  Background:
    Given a logged-in user
    And "Change password" page is open

  Scenario: Change password successfully
    Given "Change password" page is open
    And the "Current password" field appears purple when active
    And the field turns red when left empty
    And the user has entered current password correctly
    And the user enters new password
    And the new password is at least 8 characters one capital letter, one lowercase letter and one number
    And the new password field turns green when active
    And the user enters same password in "Confirm password" field
    And the confirm password field turns green when active
    And the in both fields password match
    And the "Update" button turns black
    When the user clicks on the "Update" button
    Then the password is changed
    And "Password changed" is displayed in a green field above the "Current password" field
    And the user is navigated to the home page after 3 seconds

  Scenario: Change password unsuccessfully (Non-matching passwords)
    Given the user has entered their current password correctly
    And the user enters a new password (which complies with the rules mentioned in Scenario: Change password successfully)
    When the user enters a different password in "Confirm password" field than in "New password" field
    Then an error is displayed "Passwords do not match"

  Scenario: Change password unsuccessfully (Current password incorrect)
    Given the user has entered their current password incorrectly
    And the user enters a new password (which complies with the rules mentioned in Scenario: Change password successfully)
    And the user enters the same password in the "Confirm password" field
    When the user clicks on the "Update" button
    Then an error is displayed "Failed attempt: current password incorrect"
