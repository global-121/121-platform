import BasePage from '@121-e2e/portal/pages/BasePage';

class HomePage extends BasePage {
  async openCreateNewProject() {
    await this.page.getByRole('button', { name: 'Add project' }).click();
  }
}

export default HomePage;
