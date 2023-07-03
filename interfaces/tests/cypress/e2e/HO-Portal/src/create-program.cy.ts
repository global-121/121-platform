import programOCW from '../../../../../../services/121-service/seed-data/program/program-nlrc-ocw.json';

describe("'Create program API endpoint", () => {
  beforeEach(() => {
    cy.seedDatabase();
  });

  it(`should return a program after creation`, function () {
    programOCW.titlePortal.en = 'Cypress program';
    cy.fixture('create-program').then((fixture) => {
      cy.setServer();
      cy.loginApi(true);
      cy.request({
        method: 'POST',
        url: fixture.url,
        body: programOCW,
      }).then(function (response) {
        const programId = response.body.id;
        cy.request({
          method: 'GET',
          url: `${fixture.url}/${programId}`,
          qs: { formatCreateProgramDto: true },
        }).then(function (response) {
          const programOCWObj = JSON.parse(JSON.stringify(programOCW));
          const respObj = JSON.parse(JSON.stringify(response.body));
          for (const key of Object.keys(programOCW)) {
            if (
              typeof programOCW[key] === 'number' ||
              typeof programOCW[key] === 'string' ||
              typeof programOCW[key] === 'boolean'
            ) {
              expect(programOCW[key]).to.be.equal(respObj[key]);
            } else if (Array.isArray(programOCW[key])) {
              expect(respObj[key]).to.have.lengthOf(programOCWObj[key].length);
            } else {
              expect(respObj[key]).to.be.deep.equal(programOCWObj[key]);
            }
          }
          expect(
            respObj.financialServiceProviders.configuration,
          ).to.be.deep.equal(
            programOCWObj.financialServiceProviders.configuration,
          );
        });
      });
    });
  });
});
