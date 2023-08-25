@ho-portal

Feature: Change password

  Background:
    Given a logged-in user
    And "Change password" page is open

  Scenario: Change password succesfully
    Given "Change password" page is open
    When "Current password" field apperas purple when active
    And field turns red when left empty
    And user has entered current password correctly 
    And user enters new password
    And new password is at least 8 characters one capital letter, one lowercase letter and one number
    And new password field turns green when active
    And user enters same password in "Confirm password" field
    And confirm password field turns green when avtive
    And in both fields password match
    And update button turns black
    Then when user clicks on "Update" button 
    And password is changed
    And "Password changed" is displayed in green field above "Current password" field
    And user is navigated to home page in 3 seconds

  Scenario: Change password unsuccesfully
    Given user has entered current password incorrectly
    When existing password is not at least 8 characters one capital letter, one lowercase letter and one number
    And existing password field turns red
    And new password is not at least 8 characters one capital letter, one lowercase letter and one number
    And user enters different password in "Confirm password" field
    And error is displayd "Passwords do not match"
    Then "New password" and "Confirm password" fields are filled correctly
    And update button turns black 
    Then "Failed attempt: current password incorrect" is dispalyed in red field above "Current password" field 
