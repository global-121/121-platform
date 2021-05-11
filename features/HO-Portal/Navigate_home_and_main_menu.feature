@ho-portal
Feature: Navigate home page and main menu

  Scenario: View home screen
    When a user with the "run program" or "personal data" role logs in the HO-portal
    Then the user sees the "home page"
    And sees a list of all programs on this screen
    And sees a "menu" icon in the top-left of the screen

  Scenario: Open a program-page
    Given a logged-in user
    Given the user views the "home page"
    When the user clicks on a program in the list
    Then a program-specific page opens
    And the header shows the "title" of the program
    And a "back-arrow" is shown between the "menu" icon and the "title"

  Scenario: Go back to home-page
    Given a logged-in user
    Given the user views the program-specific page
    When the user clicks the "back-arrow"
    Then the "home page" is shown again

  Scenario: Open main menu
    Given a logged-in user
    When the user clicks the "menu" icon
    Then the "main menu" opens on the left side of the screen
    And shows a "home" option
    And shows a "help" option
    And shows a "logout" option accompanied by the "userRole" of the logged-in user

  Scenario: Close main menu
    Given a logged-in user
    Given an opened "main menu"
    When the user clicks outside of the main menu
    Then the "main menu" collapses again

  Scenario: Go to help-page
    Given a logged-in user
    Given an opened "main menu"
    When the user clicks the "help" option
    Then the "help" page is shown

  Scenario: Logout
    Given a logged-in user
    Given an opened "main menu"
    When the user clicks the "logout" option
    Then the user is logged out
    And the "login" page is shown
    And the "main-menu" collapses
    And the "menu" icon disappears
