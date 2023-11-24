  @portal

  Background:
    Given user is on Users page

  Scenario: View "Users" page
    Given user is on Users page
    Given Users tab is open
    When Details are displayed in table in order (Name, User Type, Status, Last login)
    Then under Name user emails are displayed
    And possible User Types are Admin and Regular
    And status can be Active
    And last login is displayed in format (dd/mm/yyyy) or empty
    And user clicks on a column users are sorted alphabetically or numerically
    And above users table on the left side filtering field is displayed
    And on the right side on top of user table "Add new user" button is displayed

  Scenario: View roles permissions tab
    When User clicks on "Roles and permissions" tab
    Then Admin and Regular roles are displayed
    And Under admin "Admin can view and edit data, add new user and create new project"
