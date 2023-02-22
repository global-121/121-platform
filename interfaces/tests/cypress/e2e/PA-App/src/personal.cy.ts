describe('Personal Page', () => {
  beforeEach(() => {
    cy.setPaApp();
  });

  it('shows the default landing page', function () {
    cy.fixture('pa-home').then((pa) => {
      cy.visit(pa.start);
      cy.get('app-personal');
    });
  });
});
