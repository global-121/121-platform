import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { API_PATHS, EXTERNAL_API } from '../../config';
import { FspName } from '../../fsp/enum/fsp-name.enum';
import { ImageCodeService } from '../../payments/imagecode/image-code.service';
import { TransactionEntity } from '../../payments/transactions/transaction.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { CustomDataAttributes } from '../../registration/enum/custom-data-attributes';
import { RegistrationEntity } from '../../registration/registration.entity';
import { ProgramPhase } from '../../shared/enum/program-phase.model';
import {
  MessageContentType,
  TemplatedMessages,
} from '../enum/message-type.enum';
import { ProgramNotificationEnum } from '../enum/program-notification.enum';
import {
  TwilioIncomingCallbackDto,
  TwilioStatus,
  TwilioStatusCallbackDto,
} from '../twilio.dto';
import { TwilioMessageEntity } from '../twilio.entity';
import { IntersolveVoucherEntity } from '../../payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { IntersolveVoucherService } from '../../payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { waitFor } from '../../utils/waitFor.helper';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TryWhatsappEntity } from '../whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '../whatsapp/whatsapp-pending-message.entity';
import { ProcessName } from '../enum/processor.names.enum';
import { QueueMessageService } from '../queue-message/queue-message.service';
import { MessageProccessType } from '../message-job.dto';

@Injectable()
export class MessageIncomingService {
  @InjectRepository(IntersolveVoucherEntity)
  private readonly intersolveVoucherRepository: Repository<IntersolveVoucherEntity>;
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(TransactionEntity)
  private transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ProgramEntity)
  private programRepository: Repository<ProgramEntity>;
  @InjectRepository(TryWhatsappEntity)
  private readonly tryWhatsappRepository: Repository<TryWhatsappEntity>;
  @InjectRepository(WhatsappPendingMessageEntity)
  private readonly whatsappPendingMessageRepo: Repository<WhatsappPendingMessageEntity>;

  private readonly fallbackLanguage = 'en';
  private readonly genericDefaultReplies = {
    en: 'This is an automated message. Your phone number is not recognized for any 121 program. For questions please contact the NGO.',
  };

  public constructor(
    private readonly imageCodeService: ImageCodeService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly dataSource: DataSource,
    @InjectQueue('messageStatusCallback')
    private readonly messageStatusCallbackQueue: Queue,
    private readonly queueMessageService: QueueMessageService,
  ) {}

  public getGenericNotificationText(
    language: string,
    program: ProgramEntity,
  ): string {
    const key = ProgramNotificationEnum.whatsappGenericMessage;
    const fallbackNotifications = program.notifications[this.fallbackLanguage];
    let notifications = fallbackNotifications;

    if (program.notifications[language]) {
      notifications = program.notifications[language];
    }
    if (notifications[key]) {
      return notifications[key];
    }
    return fallbackNotifications[key] ? fallbackNotifications[key] : '';
  }

  public async findOne(sid: string): Promise<TwilioMessageEntity> {
    const findOneOptions = {
      sid: sid,
    };
    return await this.twilioMessageRepository.findOneBy(findOneOptions);
  }

  public async addSmsStatusCallbackToQueue(
    callbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    await this.messageStatusCallbackQueue.add(ProcessName.sms, callbackData);
  }

  public async processSmsStatusCallback(callbackData): Promise<void> {
    await this.twilioMessageRepository.update(
      { sid: callbackData.MessageSid },
      { status: callbackData.SmsStatus || callbackData.MessageStatus },
    );
  }

  public async addWhatsappStatusCallbackToQueue(
    callbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    await this.messageStatusCallbackQueue.add(
      ProcessName.whatsapp,
      callbackData,
    );
  }

  public async processWhatsappStatusCallback(
    callbackData: TwilioStatusCallbackDto,
  ): Promise<void> {
    if (
      callbackData.MessageStatus === TwilioStatus.delivered ||
      callbackData.MessageStatus === TwilioStatus.failed
    ) {
      const tryWhatsapp = await this.tryWhatsappRepository.findOne({
        where: { sid: callbackData.SmsSid },
        relations: ['registration'],
      });
      if (tryWhatsapp) {
        await this.handleTryWhatsappResult(callbackData, tryWhatsapp);
      }
    }

    // if we get a faulty 63016 we retry sending a message, and we don't need to update the status
    if (
      callbackData.ErrorCode === '63016' &&
      [TwilioStatus.undelivered, TwilioStatus.failed].includes(
        callbackData.MessageStatus,
      )
    ) {
      const message = await this.twilioMessageRepository.findOne({
        where: { sid: callbackData.MessageSid },
      });
      if (
        message &&
        !TemplatedMessages.includes(message.contentType) &&
        message.retryCount < 3
      ) {
        if (callbackData.MessageStatus === TwilioStatus.undelivered) {
          await this.handleFaultyTemplateError(callbackData, message);
        }
        return;
      }
    }

    // Update message status
    await this.twilioMessageRepository.update(
      {
        sid: callbackData.MessageSid,
        status: Not(In([TwilioStatus.read, TwilioStatus.failed])),
      },
      {
        status: callbackData.MessageStatus,
        errorCode: callbackData.ErrorCode,
        errorMessage: callbackData.ErrorMessage,
      },
    );

    // Update intersolve voucher transaction status if applicable
    const relevantStatuses = [
      TwilioStatus.delivered,
      TwilioStatus.read,
      TwilioStatus.failed,
      TwilioStatus.undelivered,
    ];
    if (relevantStatuses.includes(callbackData.MessageStatus)) {
      const messageWithTransaction = await this.twilioMessageRepository.findOne(
        {
          where: { sid: callbackData.MessageSid, transactionId: Not(IsNull()) },
          select: ['transactionId'],
        },
      );
      if (messageWithTransaction) {
        await this.intersolveVoucherService.processStatus(
          callbackData,
          messageWithTransaction.transactionId,
        );
      }
    }
  }

  private async handleFaultyTemplateError(
    callbackData: TwilioStatusCallbackDto,
    message: TwilioMessageEntity,
  ): Promise<void> {
    await this.twilioMessageRepository.update(
      {
        sid: callbackData.MessageSid,
      },
      {
        retryCount: message.retryCount + 1,
      },
    );
    // Wait before retrying
    await waitFor(30_000);
    const registration = await this.registrationRepository.findOne({
      where: { id: message.registrationId },
    });

    // Since we do not know what message was failed we need to determine process type based on content type
    let messageProcessType: MessageProccessType;
    if (message.contentType === MessageContentType.custom) {
      messageProcessType = MessageProccessType.whatsappPendingInformation;
    } else if (message.contentType === MessageContentType.paymentVoucher) {
      messageProcessType = MessageProccessType.whatsappPendingVoucher;
    } else if (message.contentType === MessageContentType.paymentInstructions) {
      messageProcessType = MessageProccessType.whatsappPendingInformation;
    } else if (message.contentType === MessageContentType.defaultReply) {
      messageProcessType = MessageProccessType.whatsappNoPendingMessages;
    }

    await this.queueMessageService.addMessageToQueue(
      registration,
      message.body,
      null,
      false,
      message.contentType,
      messageProcessType,
      message.mediaUrl,
      {
        replyMessage: true,
        pendingMessageId: message.id, // This will also get filled incorrctly for payment reply message, but it will simply not be handled on the processor-side
        existingMessageSid: callbackData.MessageSid,
      },
      1,
    );
  }

  private async handleTryWhatsappResult(
    callbackData: TwilioStatusCallbackDto,
    tryWhatsapp: TryWhatsappEntity,
  ): Promise<void> {
    if (
      callbackData.MessageStatus === TwilioStatus.failed &&
      callbackData.ErrorCode === '63003'
    ) {
      // PA does not have whatsapp
      // Send pending message via sms
      const whatsapPendingMessages = await this.whatsappPendingMessageRepo.find(
        {
          where: { to: tryWhatsapp.registration.phoneNumber },
          relations: ['registration'],
        },
      );
      for (const w of whatsapPendingMessages) {
        await this.queueMessageService.addMessageToQueue(
          w.registration,
          w.body,
          null,
          false,
          MessageContentType.invited,
          MessageProccessType.sms,
        );
        await this.whatsappPendingMessageRepo.remove(w);
      }
      await this.tryWhatsappRepository.remove(tryWhatsapp);
    }
    if (callbackData.MessageStatus === TwilioStatus.delivered) {
      // PA does have whatsapp
      // Store PA phone number as whatsappPhonenumber
      // Since it is for now impossible to store a whatsapp number without a chosen FSP
      // Explicitely search for the the fsp intersolve (in the related FSPs of this program)
      // This should be refactored later
      const program = await this.programRepository.findOne({
        where: { id: tryWhatsapp.registration.programId },
        relations: ['financialServiceProviders'],
      });
      const fspIntersolveWhatsapp = program.financialServiceProviders.find(
        (fsp) => {
          return (fsp.fsp = FspName.intersolveVoucherWhatsapp);
        },
      );
      tryWhatsapp.registration.fsp = fspIntersolveWhatsapp;
      const savedRegistration = await this.registrationRepository.save(
        tryWhatsapp.registration,
      );
      await savedRegistration.saveData(tryWhatsapp.registration.phoneNumber, {
        name: CustomDataAttributes.whatsappPhoneNumber,
      });
      await this.tryWhatsappRepository.remove(tryWhatsapp);
    }
  }

  private async getRegistrationsWithPhoneNumber(
    phoneNumber,
  ): Promise<RegistrationEntity[]> {
    const registrationsWithPhoneNumber = await this.dataSource
      .getRepository(RegistrationEntity)
      .createQueryBuilder('registration')
      .select('registration')
      .leftJoin('registration.data', 'registration_data')
      .leftJoinAndSelect(
        'registration.whatsappPendingMessages',
        'whatsappPendingMessages',
      )
      .leftJoinAndSelect('registration.program', 'program')
      .leftJoin('registration_data.fspQuestion', 'fspQuestion')
      .where('registration.phoneNumber = :phoneNumber', {
        phoneNumber: phoneNumber,
      })
      .orWhere(
        new Brackets((qb) => {
          qb.where('registration_data.value = :whatsappPhoneNumber', {
            whatsappPhoneNumber: phoneNumber,
          }).andWhere('fspQuestion.name = :name', {
            name: CustomDataAttributes.whatsappPhoneNumber,
          });
        }),
      )
      .orderBy('whatsappPendingMessages.created', 'ASC')
      .getMany();

    if (!registrationsWithPhoneNumber.length) {
      const phoneNumberLog = !!process.env.MOCK_TWILIO
        ? phoneNumber
        : phoneNumber.substr(-5).padStart(phoneNumber.length, '*');
      console.log(
        'Incoming WhatsApp-message from non-registered phone-number: ',
        phoneNumberLog,
      );
    }
    return registrationsWithPhoneNumber;
  }

  private async getRegistrationsWithOpenVouchers(
    registrations: RegistrationEntity[],
  ): Promise<RegistrationEntity[]> {
    // Trim registrations down to only those with outstanding vouchers
    const registrationIds = registrations.map((c) => c.id);
    const registrationWithVouchers = await this.registrationRepository.find({
      where: { id: In(registrationIds) },
      relations: ['images', 'images.voucher'],
    });

    const filteredRegistrations: RegistrationEntity[] = [];
    for (const r of registrationWithVouchers) {
      // Don't send more then 3 vouchers, so no vouchers of more than 2 payments ago
      const lastPayment = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('MAX(transaction.payment)', 'max')
        .where('transaction.programId = :programId', {
          programId: r.programId,
        })
        .getRawOne();
      const minimumPayment = lastPayment ? lastPayment.max - 2 : 0;

      r.images = r.images.filter(
        (image) =>
          !image.voucher.send && image.voucher.payment >= minimumPayment,
      );
      if (r.images.length > 0) {
        filteredRegistrations.push(r);
      }
    }
    return filteredRegistrations;
  }

  private cleanWhatsAppNr(value: string): string {
    return value.replace('whatsapp:+', '');
  }

  public async handleIncomingWhatsapp(
    callbackData: TwilioIncomingCallbackDto,
  ): Promise<void> {
    if (!callbackData.From) {
      throw new HttpException(
        `No "From" address specified.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const fromNumber = this.cleanWhatsAppNr(callbackData.From);

    // Get (potentially multiple) registrations on incoming phonenumber
    const registrationsWithPhoneNumber =
      await this.getRegistrationsWithPhoneNumber(fromNumber);

    const registrationsWithPendingMessage = registrationsWithPhoneNumber.filter(
      (registration: RegistrationEntity) =>
        registration.whatsappPendingMessages.length > 0,
    );

    const registrationsWithOpenVouchers =
      await this.getRegistrationsWithOpenVouchers(registrationsWithPhoneNumber);

    // If no registrations with outstanding vouchers or messages: send auto-reply
    if (
      registrationsWithOpenVouchers.length === 0 &&
      registrationsWithPendingMessage.length === 0
    ) {
      let program: ProgramEntity;
      // If phonenumber is found in active programs but the registration has no outstanding vouchers/messages use the corresponding program
      const registrationsWithPhoneNumberInActivePrograms =
        registrationsWithPhoneNumber.filter((registration) =>
          [
            ProgramPhase.registrationValidation,
            ProgramPhase.inclusion,
            ProgramPhase.payment,
          ].includes(registration.program.phase),
        );
      if (registrationsWithPhoneNumberInActivePrograms.length > 0) {
        program = registrationsWithPhoneNumberInActivePrograms[0].program;
      } else {
        // If only 1 program in database: use default reply of that program
        const programs = await this.dataSource
          .getRepository(ProgramEntity)
          .find();
        if (programs.length === 1) {
          program = programs[0];
        }
      }
      if (program) {
        const language =
          registrationsWithPhoneNumber[0]?.preferredLanguage ||
          this.fallbackLanguage;
        const whatsappDefaultReply =
          program.notifications[language][
            ProgramNotificationEnum.whatsappReply
          ];
        await this.queueMessageService.addMessageToQueue(
          registrationsWithPhoneNumber[0],
          whatsappDefaultReply,
          null,
          false,
          MessageContentType.defaultReply,
          MessageProccessType.whatsappNoPendingMessages,
        );
        return;
      } else {
        // If multiple or 0 programs and phonenumber not found: use generic reply in code
        await this.queueMessageService.addMessageToQueue(
          registrationsWithPhoneNumber[0],
          this.genericDefaultReplies[this.fallbackLanguage],
          null,
          false,
          MessageContentType.defaultReply,
          MessageProccessType.whatsappNoPendingMessages,
        );
        return;
      }
    }

    // Start loop over (potentially) multiple PAs
    let firstVoucherSent = false;
    for await (const registration of registrationsWithOpenVouchers) {
      const intersolveVouchersPerPa = registration.images.map(
        (image) => image.voucher,
      );
      const program = await this.dataSource
        .getRepository(ProgramEntity)
        .findOneBy({
          id: registration.programId,
        });
      const language = registration.preferredLanguage || this.fallbackLanguage;

      // Loop over current and (potentially) old vouchers per PA
      for await (const intersolveVoucher of intersolveVouchersPerPa) {
        const mediaUrl =
          await this.imageCodeService.createVoucherUrl(intersolveVoucher);

        // Only include text with first voucher (across PAs and payments)
        let message = firstVoucherSent
          ? ''
          : program.notifications[language][
              ProgramNotificationEnum.whatsappVoucher
            ];
        message = message.split('{{1}}').join(intersolveVoucher.amount);
        await this.queueMessageService.addMessageToQueue(
          registration,
          message,
          null,
          false,
          MessageContentType.paymentVoucher,
          MessageProccessType.whatsappPendingVoucher,
          mediaUrl,
          {
            payment: intersolveVoucher.payment,
            amount: intersolveVoucher.amount,
            intersolveVoucherId: intersolveVoucher.id,
          },
        );
        firstVoucherSent = true;

        // Add small delay to ensure the order in which messages are received
        await waitFor(2_000);
      }

      // Send instruction message only once (outside of loops)
      if (registrationsWithOpenVouchers.length > 0) {
        await this.queueMessageService.addMessageToQueue(
          registration,
          '',
          null,
          false,
          MessageContentType.paymentInstructions,
          MessageProccessType.whatsappPendingInformation,
          `${EXTERNAL_API.baseApiUrl}programs/${program.id}/${API_PATHS.voucherInstructions}`,
        );
      }
    }
    if (
      registrationsWithPendingMessage &&
      registrationsWithPendingMessage.length > 0
    ) {
      await this.sendPendingWhatsappMessages(registrationsWithPendingMessage);
    }
  }

  private async sendPendingWhatsappMessages(
    registrationsWithPendingMessage: RegistrationEntity[],
  ): Promise<void> {
    for (const registration of registrationsWithPendingMessage) {
      if (registration.whatsappPendingMessages) {
        for (const message of registration.whatsappPendingMessages) {
          await this.queueMessageService.addMessageToQueue(
            registration,
            message.body,
            null,
            false,
            message.contentType,
            MessageProccessType.whatsappPendingInformation,
            message.mediaUrl,
            { replyMessage: true, pendingMessageId: message.id },
          );
          await waitFor(2_000);
        }
      }
    }
  }
}
