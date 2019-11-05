import { voiceXmlUrl, TWILIO_MP3, callbackUrlVoice } from './../twilio.client';
import fs from 'fs';
import { Injectable } from '@nestjs/common';
import { TWILIO } from '../../secrets';
import { twilioClient, twilio } from '../twilio.client';
import { Request, Response, NextFunction } from 'express';
import { NotificationType, TwilioMessageEntity } from '../twilio.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class VoiceService {
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
  public constructor() {}

  public makeVoiceCall(mp3Param: string, recipientPhoneNr: string) {
    // Overwrite recipient phone number for testing phase
    recipientPhoneNr = TWILIO.testToNumber;

    twilioClient.calls
      .create({
        method: 'GET',
        url: voiceXmlUrl + mp3Param,
        to: recipientPhoneNr,
        statusCallback: callbackUrlVoice,
        from: TWILIO.testFromNumber,
      })
      .then(call => this.storeCall(call, mp3Param))
      .catch(err => {
        console.log(err);
      });
  }

  public storeCall(call, mp3Param: string) {
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

  public xmlTest(response, mp3Param) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    let mp3Url: string;
    for (let key in TWILIO_MP3) {
      let value = TWILIO_MP3[key];
      if (value.param === mp3Param) {
        mp3Url = value.url;
      }
    }
    twiml.play(mp3Url);
    response.type('text/xml');
    response.set('Content-Type', 'text/xml');
    return twiml.toString();
  }
  public async statusCallback(callbackData) {
    await this.twilioMessageRepository.update(
      { sid: callbackData.CallSid },
      { status: callbackData.CallStatus },
    );
  }
}
