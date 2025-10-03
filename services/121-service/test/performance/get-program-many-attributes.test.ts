import { HttpStatus } from '@nestjs/common';
import TestAgent from 'supertest/lib/agent';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  getServer,
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';

// Registration data for Visa program (from K6 helpers)
const registrationVisa = {
  referenceId: 'registration-visa-1',
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  fullName: 'Jane Doe',
  phoneNumber: '14155238887',
  programFspConfigurationName: 'Intersolve-visa',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
  whatsappPhoneNumber: '14155238887',
};

// Get test configuration based on environment
const isRunningInCronjob = process.env.RUNNING_IN_CRONJOB === 'true';
const duplicateNumber = isRunningInCronjob ? 5 : 3; // Light load for this test

describe('Get Program with Many Attributes Performance Test', () => {
  let accessToken: string;
  let server: TestAgent<any>;

  const resetScript = SeedScript.nlrcMultiple;
  const programId = 2;

  beforeAll(async () => {
    server = getServer();
    accessToken = await getAccessToken();

    console.log(`Running program attributes test: cronjob=${isRunningInCronjob}, duplicateNumber=${duplicateNumber} (${Math.pow(2, duplicateNumber)} registrations)`);
  });

  it('should load program with many attributes within performance thresholds', async () => {
    const testStartTime = Date.now();
    
    console.log('Starting get program with many attributes performance test...');

    // Reset database
    console.log('Resetting database...');
    let startTime = Date.now();
    const resetResponse = await resetDB(resetScript, 'getProgramWithManyAttributes.test.ts');
    
    expect(resetResponse.status).toBe(HttpStatus.ACCEPTED);
    console.log(`Database reset completed in ${Date.now() - startTime}ms`);

    // Test login performance (inline timeout like requested)
    const loginTime = Date.now() - startTime;
    if (loginTime >= 200) {
      console.log(`Login time was ${loginTime}ms (above 200ms threshold)`);
    }
    expect(loginTime).toBeLessThan(200);

    // Add 50 program registration attributes to generate bigger load
    console.log('Adding 50 program registration attributes...');
    const modifiedRegistration = { ...registrationVisa };
    
    for (let i = 1; i <= 50; i++) {
      const attributeName = `attribute${i}`;
      startTime = Date.now();
      
      const attributeResponse = await server
        .post(`/api/programs/${programId}/registration-attributes`)
        .set('Cookie', [`Authorization=${accessToken}`])
        .set('Content-Type', 'application/json')
        .send({
          options: ['string'],
          scoring: {},
          pattern: 'string',
          showInPeopleAffectedTable: false,
          editableInPortal: true,
          export: ['payment'],
          placeholder: {
            en: '+31 6 00 00 00 00',
          },
          duplicateCheck: false,
          name: attributeName,
          label: {
            en: attributeName,
            fr: 'Remplissez votre nom, sil vous plaît:',
          },
          type: 'text',
          isRequired: false,
        });
      
      expect(attributeResponse.status).toBe(HttpStatus.CREATED);
      
      // Add to registration data
      modifiedRegistration[attributeName] = 'bla';
    }

    // Import registration with all attributes
    console.log('Importing registration with attributes...');
    startTime = Date.now();
    const importResponse = await server
      .post(`/api/programs/${programId}/registrations`)
      .set('Cookie', [`Authorization=${accessToken}`])
      .set('Content-Type', 'application/json')
      .send([modifiedRegistration]);
    
    expect(importResponse.status).toBe(HttpStatus.CREATED);
    console.log(`Registration import completed in ${Date.now() - startTime}ms`);

    // Create duplicate registrations
    console.log(`Creating ${Math.pow(2, duplicateNumber)} duplicate registrations...`);
    startTime = Date.now();
    const duplicateResponse = await resetDuplicateRegistrations(duplicateNumber);
    
    expect(duplicateResponse.status).toBe(HttpStatus.ACCEPTED);
    console.log(`Duplicate creation completed in ${Date.now() - startTime}ms`);

    // Get program by ID and validate load time (main test focus)
    console.log('Testing program load performance with many attributes...');
    startTime = Date.now();
    const programResponse = await server
      .get(`/api/programs/${programId}`)
      .set('Cookie', [`Authorization=${accessToken}`]);
    
    const programLoadTime = Date.now() - startTime;
    
    expect(programResponse.status).toBe(HttpStatus.OK);
    
    if (programLoadTime >= 200) {
      console.log(`Program load time was ${programLoadTime}ms (above 200ms threshold)`);
    }
    expect(programLoadTime).toBeLessThan(200);

    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${Math.round(totalTestTime / 1000)} seconds`);
    console.log(`Program with many attributes loaded in: ${programLoadTime}ms`);
    
    // Performance expectation: should complete within reasonable time
    const maxDuration = isRunningInCronjob ? 30000 : 20000; // 30 vs 20 seconds
    expect(totalTestTime).toBeLessThan(maxDuration);
    
    console.log('Get program with many attributes performance test completed successfully');
  }, isRunningInCronjob ? 60000 : 40000); // 1 vs 40 second timeout
});
