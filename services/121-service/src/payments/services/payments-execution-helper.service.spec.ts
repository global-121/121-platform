// // ##TODO move these tests again to transaction-jobs-helper.service.spec.ts + switch from bulk to per-registration usage
// describe('PaymentsExecutionHelperService - setStatusToCompletedIfApplicable', () => {
//   let service: PaymentsExecutionHelperService;

//   let registrationScopedRepository: RegistrationScopedRepository;
//   let programRepository: ProgramRepository;
//   let messageTemplateService: MessageTemplateService;
//   let registrationsBulkService: RegistrationsBulkService;

//   beforeEach(async () => {
//     jest.resetAllMocks();

//     const { unit, unitRef } = TestBed.create(
//       PaymentsExecutionHelperService,
//     ).compile();

//     service = unit;
//     registrationScopedRepository = unitRef.get<RegistrationScopedRepository>(
//       RegistrationScopedRepository,
//     );
//     programRepository = unitRef.get<ProgramRepository>(ProgramRepository);
//     messageTemplateService = unitRef.get<MessageTemplateService>(
//       MessageTemplateService,
//     );
//     registrationsBulkService = unitRef.get<RegistrationsBulkService>(
//       RegistrationsBulkService,
//     );
//   });

//   it('does nothing when program.enableMaxPayments is false', async () => {
//     const programIdDisabled = 1;
//     const userId = 42;

//     jest.spyOn(programRepository, 'findByIdOrFail').mockResolvedValue({
//       enableMaxPayments: false,
//     } as any);

//     await service.setStatusToCompletedIfApplicable(programIdDisabled, userId);

//     expect(
//       registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
//     ).not.toHaveBeenCalled();
//   });

//   it('does nothing when there are no registrations to complete', async () => {
//     const programIdNoReg = 2;
//     const userId = 7;

//     jest.spyOn(programRepository, 'findByIdOrFail').mockResolvedValue({
//       enableMaxPayments: true,
//     } as any);
//     jest
//       .spyOn(registrationScopedRepository, 'getRegistrationsToComplete')
//       .mockResolvedValue([] as any);

//     await service.setStatusToCompletedIfApplicable(programIdNoReg, userId);

//     expect(
//       registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
//     ).not.toHaveBeenCalled();
//   });

//   it('applies registration status change with template details when template is available', async () => {
//     const programIdTemplate = 3;
//     const userIdC = 99;
//     const ref1 = 'ref-1';

//     jest.spyOn(programRepository, 'findByIdOrFail').mockResolvedValue({
//       enableMaxPayments: true,
//     } as any);
//     jest
//       .spyOn(registrationScopedRepository, 'getRegistrationsToComplete')
//       .mockResolvedValue([{ referenceId: ref1 }] as any);
//     jest
//       .spyOn(messageTemplateService, 'isTemplateAvailable')
//       .mockResolvedValue(true as any);

//     await service.setStatusToCompletedIfApplicable(programIdTemplate, userIdC);

//     expect(
//       registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
//     ).toHaveBeenCalledWith(
//       expect.objectContaining({
//         referenceIds: [ref1],
//         programId: programIdTemplate,
//         registrationStatus: RegistrationStatusEnum.completed,
//         userId: userIdC,
//         messageContentDetails: {
//           messageTemplateKey: RegistrationStatusEnum.completed,
//           messageContentType: MessageContentType.completed,
//           message: '',
//         },
//       }),
//     );
//   });

//   it('applies registration status change with empty messageContentDetails when template is not available', async () => {
//     const programIdNoTemplate = 4;
//     const userIdD = 100;
//     const ref2 = 'ref-2';

//     jest.spyOn(programRepository, 'findByIdOrFail').mockResolvedValue({
//       enableMaxPayments: true,
//     } as any);
//     jest
//       .spyOn(registrationScopedRepository, 'getRegistrationsToComplete')
//       .mockResolvedValue([{ referenceId: ref2 }] as any);
//     jest
//       .spyOn(messageTemplateService, 'isTemplateAvailable')
//       .mockResolvedValue(false as any);

//     await service.setStatusToCompletedIfApplicable(
//       programIdNoTemplate,
//       userIdD,
//     );

//     expect(
//       registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds,
//     ).toHaveBeenCalledWith(
//       expect.objectContaining({
//         referenceIds: [ref2],
//         programId: programIdNoTemplate,
//         registrationStatus: RegistrationStatusEnum.completed,
//         userId: userIdD,
//         messageContentDetails: {},
//       }),
//     );
//   });
// });
