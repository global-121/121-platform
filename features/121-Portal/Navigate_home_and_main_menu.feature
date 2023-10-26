@portal
Feature: Navigate home page and main menu

  Background:
    Given a logged-in user

  Scenario: View home screen
    When the user visits the Portal URL
    Then the "home" page is shown
    And how many (assigned) programs are running is shown in the page-header
    And a "program card" for all programs that are assigned to this user is shown

  Scenario: Open a program-page
    Given the user views the "home" page
    When the user clicks on a program-card in the list
    Then a program-specific page of the currently active program-phase opens
    And the header shows the "portal title" of the program

  Scenario: Go back to home-page
    Given the user views a program-specific page
    When the user clicks the "home" option from the main-menu
    Then the "home" page is shown
    And each "program card" is showing the latest status

  Scenario: Go to help-page
    Given the user views any page
    When the user clicks the "help" option from the main-menu
    Then the "help" page is shown

  Scenario: Logout
    When the user clicks the "logout" option
    Then the user is logged out
    And the "login" page is shown
