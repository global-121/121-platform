import PaymentsPage from '@121-e2e/pages/Payments/PaymentsPage';
import BasePage from '@121-e2e/portalicious/pages/BasePage';
import ChangePasswordPage from '@121-e2e/portalicious/pages/ChangePasswordPage';
import CreateProject from '@121-e2e/portalicious/pages/CreateProjectPage';
import HomePage from '@121-e2e/portalicious/pages/HomePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import ProjectMonitoring from '@121-e2e/portalicious/pages/ProjectMonitoringPage';
import ProjectTeam from '@121-e2e/portalicious/pages/ProjectTeam';
import RegistrationActivityLogPage from '@121-e2e/portalicious/pages/RegistrationActivityLogPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';
import UsersPage from '@121-e2e/portalicious/pages/UsersPage';

export interface Pages {
  basePage: BasePage;
  loginPage: LoginPage;
  registrations: RegistrationsPage;
  changePasswordPage: ChangePasswordPage;
  createProject: CreateProject;
  homePage: HomePage;
  usersPage: UsersPage;
  paymentsPage: PaymentsPage;
  projectMonitoring: ProjectMonitoring;
  projectTeam: ProjectTeam;
  registrationActivityLogPage: RegistrationActivityLogPage;
}
