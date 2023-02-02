import programLVV from '../../../../../../services/121-service/seed-data/program/program-pilot-nl.json';

describe("'Do Payment #1' bulk action", () => {
  beforeEach(() => {
    cy.seedDatabase();
  });

  it(`should return a program after creation`, function () {
    programLVV.titlePortal.en = 'Cypress program';
    console.log('programLVV.enableMaxPayments: ', programLVV.enableMaxPayments);
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
          console.log('response: ', response);
          const programLvvObj = JSON.parse(JSON.stringify(programLVV));
          const respObj = JSON.parse(JSON.stringify(response.body));
          const difference = diff(respObj, programLvvObj);
          console.log('difference: ', difference);
          // expect(response.body).to.deep.equal(programLVV);
          const cJson =
            JSON.stringify(response.body) === JSON.stringify(programLVV);
          console.log('cJson: ', cJson);
        });
      });
    });
  });

  function diff(tgt, src) {
    if (Array.isArray(tgt)) {
      // if you got array
      return tgt; // just copy it
    }

    // if you got object
    var rst = {};
    for (var k in tgt) {
      // visit all fields
      if (typeof src[k] === 'object') {
        // if field contains object (or array because arrays are objects too)
        rst[k] = diff(tgt[k], src[k]); // diff the contents
      } else if (src[k] !== tgt[k]) {
        // if field is not an object and has changed
        rst[k] = tgt[k]; // use new value
      }
      // otherwise just skip it
    }
    return rst;
  }
});
