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

          expect(respObj.ngo).to.be.equal(programLvvObj.ngo);
          expect(respObj.aboutProgram).to.be.deep.equal(
            programLvvObj.aboutProgram,
          );
          expect(respObj.programQuestions).to.have.lengthOf(
            programLvvObj.programQuestions.length,
          );
          expect(respObj.fullnameNamingConvention).to.have.lengthOf(
            programLvvObj.fullnameNamingConvention.length,
          );
          expect(respObj.programCustomAttributes).to.have.lengthOf(
            programLvvObj.programCustomAttributes.length,
          );
          expect(respObj.financialServiceProviders).to.be.deep.equal(
            programLvvObj.financialServiceProviders,
          );
        });
      });
    });
  });
});
