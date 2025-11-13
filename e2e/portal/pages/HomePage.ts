import BasePage from '@121-e2e/portal/pages/BasePage';

class HomePage extends BasePage {
  async openCreateNewProgram() {
    await this.page.getByRole('button', { name: 'Add program' }).click();
  }
}

export default HomePage;
