import { Injectable } from '@nestjs/common';
import { twilioClient, twilio } from '../twilio.client';
import { NotificationType, TwilioMessageEntity } from '../twilio.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import fs from 'fs';
import { EXTERNAL_API } from '../../config';

@Injectable()
export class VoiceService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  public constructor() {}

  public notifyByVoice(
    recipientPhoneNr: string,
    language: string,
    key: string,
    programId: number,
  ): void {
    if (recipientPhoneNr) {
      const mp3Param =
        programId.toString() + 'REPLACE' + language + 'REPLACE' + key;
      this.makeVoiceCall(mp3Param, recipientPhoneNr);
    }
  }

  public makeVoiceCall(mp3Param: string, recipientPhoneNr: string): void {
    // Overwrite recipient phone number for testing phase
    // recipientPhoneNr = process.env.TWILIO_TEST_TO_NUMBER;
    twilioClient.calls
      .create({
        method: 'GET',
        url: EXTERNAL_API.voiceXmlUrl + mp3Param,
        to: recipientPhoneNr,
        statusCallback: EXTERNAL_API.voiceStatus,
        from: process.env.TWILIO_TEST_FROM_NUMBER_VOICE,
      })
      .then(call => this.storeCall(call, mp3Param))
      .catch(err => {
        console.log(err);
        // Do we need error handling here?
      });
  }

  public storeCall(call, mp3Param: string): void {
    const twilioMessage = new TwilioMessageEntity();
    twilioMessage.accountSid = call.accountSid;
    twilioMessage.body = mp3Param;
    twilioMessage.to = call.to;
    twilioMessage.from = call.from;
    twilioMessage.sid = call.sid;
    twilioMessage.status = call.status;
    twilioMessage.type = NotificationType.Call;
    twilioMessage.dateCreated = new Date();
    this.twilioMessageRepository.save(twilioMessage);
  }

  public xmlResponse(mp3Param: string): any {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    const re = new RegExp('/', 'g');
    const mp3Escaped = mp3Param.replace(re, 'REPLACE');
    const mp3Url = EXTERNAL_API.voiceMp3Url + mp3Escaped;
    twiml.play(mp3Url);
    return twiml.toString();
  }

  public returnMp3Stream(mp3Param): any {
    const re = new RegExp('REPLACE', 'g');
    const subpath = mp3Param.replace(re, '/');
    const filePath = './voice/' + subpath + '.mp3';
    const stat = fs.statSync(filePath);
    const readStream = fs.createReadStream(filePath);
    return { stat: stat, readStream: readStream };
  }

  public async statusCallback(callbackData): Promise<void> {
    await this.twilioMessageRepository.update(
      { sid: callbackData.CallSid },
      { status: callbackData.CallStatus },
    );
  }
}
