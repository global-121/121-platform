@ho-portal
Feature: Navigate program phases

  Background:
    Given a logged-in "project-officer" user

  Scenario: See current phase of the program
    When the user views a "program" page
    Then the user sees a "phase-navigation-bar" with "six" possible phases of the program in the header
    And sees the "current program phase" of the program highlighted in background-color and text-color
    And sees that future phases are disabled
    And sees that past phases are enabled
    And sees the "move-to-next-phase"-button below the header, unless the "current program phase" is the last phase
    And this button is "disabled" for the "program-manager"
    And this button is "disabled" if the "selected phase" is not the "active phase"
    And this button is "disabled" if "phase" is "inclusion" and there are "enrolled" but not "in/excluded" people in the "people-list"
    And this button is "disabled" if "phase" is "payment" and not all "installments" are "closed" 

  Scenario: Change to past phase
    Given the user views a "program" page
    When the user clicks one of the past phases in the "phase-navigation-bar"
    Then the background-color of the selected phase changes and reflects the "selected phase"
    And the text-color ot the previous phase remains different and reflects the "current program phase"
    And sees that the "move-to-next-phase"-button is disabled, reflecting the read-only mode of past phases.
    And sees that the text of the of the "move-to-next-phase"-button changes, reflecting the meaning of the phase-change.
    And sees - depending on which state - that certain program-components in the page will (dis)appear.

  Scenario: Advancing to next phase
    Given user views a "program" page
    Given "selected phase" is equal to "current program phase"
    When user clicks the "move-to-next-phase"-button
    Then highlighting in the "phase-navigation-bar" will move to the next phase, both background- and text-color, reflecting a change in both "current program phase" and "selected phase"
    And sees that the text of the of the "move-to-next-phase"-button changes, reflecting the meaning of the next phase-change.
    And sees - depending on which state - that certain program-components in the page will (dis)appear. 

