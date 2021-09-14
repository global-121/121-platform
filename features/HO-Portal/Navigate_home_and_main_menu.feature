@ho-portal
Feature: Navigate home page and main menu

  Scenario: View home screen
    When a user with the "run program" or "personal data" role logs in the HO-portal
    Then the user sees the "home" page
    And sees a list of all programs on this screen

  Scenario: Open a program-page
    Given a logged-in user
    Given the user views the "home" page
    When the user clicks on a program in the list
    Then a program-specific page opens
    And the header shows the "title" of the program

  Scenario: Go back to home-page
    Given a logged-in user
    Given the user views the program-specific page
    When the user clicks the "home" option
    Then the "home" page is shown again

  Scenario: Go to help-page
    Given a logged-in user
    Given the user views the "home" page
    When the user clicks the "question-mark" option
    Then the "help" page is shown

  Scenario: Logout
    Given a logged-in user
    When the user clicks the "logout" option
    Then the user is logged out
    And the "login" page is shown
