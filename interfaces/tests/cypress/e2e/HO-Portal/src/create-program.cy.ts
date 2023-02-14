import programLVV from '../../../../../../services/121-service/seed-data/program/program-pilot-nl.json';

describe("'Create program API endpoint", () => {
  beforeEach(() => {
    cy.seedDatabase();
  });

  it(`should return a program after creation`, function () {
    programLVV.titlePortal.en = 'Cypress program';
    cy.fixture('create-program').then((fixture) => {
      cy.setServer();
      cy.loginApi(true);
      cy.request({
        method: 'POST',
        url: fixture.url,
        body: programLVV,
      }).then(function (response) {
        const programId = response.body.id;
        cy.request({
          method: 'GET',
          url: `${fixture.url}/${programId}`,
          qs: { formatCreateProgramDto: true },
        }).then(function (response) {
          const programLvvObj = JSON.parse(JSON.stringify(programLVV));
          const respObj = JSON.parse(JSON.stringify(response.body));
          for (const key of Object.keys(programLVV)) {
            if (
              typeof programLVV[key] === 'number' ||
              typeof programLVV[key] === 'string' ||
              typeof programLVV[key] === 'boolean'
            ) {
              expect(programLVV[key]).to.be.equal(respObj[key]);
            } else if (Array.isArray(programLVV[key])) {
              expect(respObj[key]).to.have.lengthOf(programLvvObj[key].length);
            } else {
              expect(respObj[key]).to.be.deep.equal(programLvvObj[key]);
            }
          }
          expect(respObj.financialServiceProviders).to.be.deep.equal(
            programLvvObj.financialServiceProviders,
          );
        });
      });
    });
  });
});
