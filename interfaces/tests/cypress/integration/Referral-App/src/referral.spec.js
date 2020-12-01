describe("Referral Page", () => {
  beforeEach(() => {
    cy.setReferralApp();
    cy.server();
  });

  // Real API call
  it("shows the default landing page", function () {
    cy.fixture("referral").then((ref) => {
      cy.visit(ref.portal);
      cy.url().should("include", "/");
    });
  });
});
