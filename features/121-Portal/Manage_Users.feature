@ho-portal

Background:
    Given user is on Users page

Scenario: View "See users" page
Given user is on Users page
Given Users tab is open
When Details are displayed in table in order (Name, Role, Status, Last activity)
Then under Name user emails are displayed
And possible Roles are Admin and Regular
And status can be Active
And user clicks on "Name" users are sorted by emails alphabetically
And user clicks on "Role" users are sorted by user types alphabetically
And user clicks on "Status" users are sorted by status alphabetically
And user clicks on "Last activity" users are sorted by earliest date
And above users table on the left side filtering field is displayed
And on the right side on top of user table "Add new user" button is displayed

Scenario: Add New Team member
When User clicks on "Add new user" button
And pup-up is displayed
Then user enter team members email
And Selects User type for team member
Then Clicks on "Add" butto
And Notification with "You've succsessfully added a team member" message is displayed
And user clicks on "X" on popup
And Popup is closed

Scenario: Edit Team members Role

Given There is a team member on the list
When User clicks on Three dot icon on the right side of row where team member is displayed
And Meatball menu is displayed
And User clicks on "Edit user"
Then pop-up is displayed
And user is not able to edit email
And User changes Role of team member
And click "Save" button
Then "You've succsessfully edited the role(s) of this user"
And user clicks on "X" on popup
And Popup is closed

Scenario: Remove team member
Given There is a team member on the list
When User clicks on Three dot icon on the right side of row where team member is displayed
And Meatball menu is displayed
And User clicks on "Remove user"
And warning message is displayed
And user clicks on "Remove"
Then "You've succsessfully removed this team member" message is displayed
And user clicks on "X" on popup
And Popup is closed

Scenario:View roles permissions tab
When User clicks on "Roles and permissions" tab
Then Admin and Regular roles are displayed
And Under admin "Admin can view and edit data, add new user and create new project "
