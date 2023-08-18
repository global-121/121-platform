@ho-portal

Feature: Change password

  Background:
    Given a logged-in user
    And "Change password" page is open

  Scenario: Change password succesfully
    Given user has entered current password correctly
    Given Existing password field apperas green when active
    When user enters new password
    And new password is at least 8 characters one capital letter, one lowercase letter and one number
    And new password field turns green when avtive
    And user enters same password in "Confirm password" field
    And confirm password field turns green when avtive
    And in both fields password match
    And update button turns black
    Then when user clicks on "Update" button password is changed
    And user is navigated to different page
    And "Password changed" is displayed

  Scenario: Change password unsuccesfully
    When user has entered current password incorrectly
    And existing password is not at least 8 characters one capital letter, one lowercase letter and one number
    And existing password field turns red
    And new password is not at least 8 characters one capital letter, one lowercase letter and one number
    And user enters different password in "Confirm password" field
    And confirm password field turns red
    And update button turns black\
    And "Passwords do not match" is dispalyed under "Confirm password" field
    Then when user clicks on "Update" button password is changed
    And user is navigated to different page
    And "Password change failed" is displayed