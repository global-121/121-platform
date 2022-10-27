@portal
Feature: Navigate home page and main menu

  Background:
    Given a logged-in user

  Scenario: View home screen
    When the user views the home screen
    Then the user sees the "home" page
    And sees a "program card" for all programs that are assigned to this user
    And sees a message on how many (assigned) programs are running

  Scenario: Open a program-page
    Given a logged-in user
    Given the user views the "home" page
    When the user clicks on a program in the list
    Then a program-specific page opens
    And the header shows the "portal title" of the program

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
