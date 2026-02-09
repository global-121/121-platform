import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getIntersolveInstructionsImage,
  getPaperVoucherImage,
  getTransactionsIntersolveVoucher,
  getWhatsappVoucherImage,
  postIntersolveInstructionsImage,
} from '@121-service/test/helpers/fsp-specific.helper';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenCvaManager,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Intersolve Voucher Controller', () => {
  let accessToken: string;

  const transferValue = 22;

  beforeEach(async () => {
    await waitFor(1_000);
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  describe('GET /paper-voucher-image', () => {
    it('should successfully return image', async () => {
      // Arrange
      registrationPV5.programFspConfigurationName = Fsps.intersolveVoucherPaper;
      await importRegistrations(programIdPV, [registrationPV5], accessToken);
      await awaitChangeRegistrationStatus({
        programId: programIdPV,
        referenceIds: [registrationPV5.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationPV5.referenceId];
      const paymentResponse = await doPayment({
        programId: programIdPV,
        transferValue,
        referenceIds: paymentReferenceIds,
        accessToken,
      });

      // make sure to wait for the transaction to be completed
      const getTransactionsBody = await getTransactionsIntersolveVoucher({
        programId: programIdPV,
        paymentId: paymentResponse.body.id,
        referenceId: registrationPV5.referenceId,
        accessToken,
      });
      expect(getTransactionsBody[0].status).toBe('success');

      // Act
      const getVoucherResponse = await getPaperVoucherImage(
        programIdPV,
        paymentResponse.body.id,
        registrationPV5.referenceId,
        accessToken,
      );

      // Assert
      expect(getVoucherResponse.status).toBe(HttpStatus.OK);
      expect(getVoucherResponse.headers['content-type']).toBe('image/png');
      expect(getVoucherResponse.body.length).toBeGreaterThan(0);
    });

    it('should return 403 for invalid payment', async () => {
      // Arrange
      registrationPV5.programFspConfigurationName = Fsps.intersolveVoucherPaper;
      await importRegistrations(programIdPV, [registrationPV5], accessToken);
      await awaitChangeRegistrationStatus({
        programId: programIdPV,
        referenceIds: [registrationPV5.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });

      // Act - Try to get image for non-existent payment
      const response = await getPaperVoucherImage(
        programIdPV,
        999, // Non-existent payment
        registrationPV5.referenceId,
        accessToken,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return 403 for invalid programId', async () => {
      // Arrange
      registrationPV5.programFspConfigurationName = Fsps.intersolveVoucherPaper;
      await importRegistrations(programIdPV, [registrationPV5], accessToken);
      await awaitChangeRegistrationStatus({
        programId: programIdPV,
        referenceIds: [registrationPV5.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationPV5.referenceId];
      const paymentResponse = await doPayment({
        programId: programIdPV,
        transferValue,
        referenceIds: paymentReferenceIds,
        accessToken,
      });

      const paymentId = paymentResponse.body.id;

      // Act - Try to get image with invalid program ID
      const response = await getPaperVoucherImage(
        99999, // Non-existent program
        paymentId,
        registrationPV5.referenceId,
        accessToken,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /whatsapp-voucher-image', () => {
    it('should successfully return image', async () => {
      // Arrange
      registrationPV5.programFspConfigurationName =
        Fsps.intersolveVoucherWhatsapp;
      await importRegistrations(programIdPV, [registrationPV5], accessToken);
      await awaitChangeRegistrationStatus({
        programId: programIdPV,
        referenceIds: [registrationPV5.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationPV5.referenceId];
      const paymentResponse = await doPayment({
        programId: programIdPV,
        transferValue,
        referenceIds: paymentReferenceIds,
        accessToken,
      });

      // make sure to wait for the transaction to be completed
      const getTransactionsBody = await getTransactionsIntersolveVoucher({
        programId: programIdPV,
        paymentId: paymentResponse.body.id,
        referenceId: registrationPV5.referenceId,
        accessToken,
      });

      // Act
      const getVoucherResponse = await getWhatsappVoucherImage(
        programIdPV,
        paymentResponse.body.id,
        registrationPV5.referenceId,
        accessToken,
      );

      // Assert
      expect(getTransactionsBody[0].status).toBe('success');
      expect(getVoucherResponse.status).toBe(HttpStatus.OK);
      expect(getVoucherResponse.headers['content-type']).toBe('image/png');
      expect(getVoucherResponse.body.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent payment', async () => {
      // Arrange
      registrationPV5.programFspConfigurationName =
        Fsps.intersolveVoucherWhatsapp;
      await importRegistrations(programIdPV, [registrationPV5], accessToken);
      await awaitChangeRegistrationStatus({
        programId: programIdPV,
        referenceIds: [registrationPV5.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });

      // Act - Try to get image for non-existent payment
      const response = await getWhatsappVoucherImage(
        programIdPV,
        999, // Non-existent payment
        registrationPV5.referenceId,
        accessToken,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return 403 for invalid programId', async () => {
      // Arrange
      registrationPV5.programFspConfigurationName =
        Fsps.intersolveVoucherWhatsapp;
      await importRegistrations(programIdPV, [registrationPV5], accessToken);
      await awaitChangeRegistrationStatus({
        programId: programIdPV,
        referenceIds: [registrationPV5.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
      const paymentReferenceIds = [registrationPV5.referenceId];
      const paymentResponse = await doPayment({
        programId: programIdPV,
        transferValue,
        referenceIds: paymentReferenceIds,
        accessToken,
      });

      const paymentId = paymentResponse.body.id;

      // Act - Try to get image with invalid program ID
      const response = await getWhatsappVoucherImage(
        99999, // Non-existent program
        paymentId,
        registrationPV5.referenceId,
        accessToken,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('Intersolve instructions image', () => {
    it('should successfully get image', async () => {
      // Arrange - First upload an image so we have something to retrieve
      const postResponse = await postIntersolveInstructionsImage(
        programIdPV,
        accessToken,
      );
      expect(postResponse.status).toBe(HttpStatus.CREATED);

      // Act
      const response = await getIntersolveInstructionsImage(programIdPV);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.headers['content-type']).toBe('image/png');
    });

    it('should return 403 when posting without admin access', async () => {
      // Arrange - Get a non-admin access token
      const nonAdminAccessToken = await getAccessTokenCvaManager();

      // Act
      const response = await postIntersolveInstructionsImage(
        programIdPV,
        nonAdminAccessToken,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for invalid program', async () => {
      // Act
      const response = await getIntersolveInstructionsImage(99999);

      // Assert
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
