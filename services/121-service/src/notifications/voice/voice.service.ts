import { voiceXmlUrl, TWILIO_MP3 } from './../twilio.client';
import fs from 'fs';
import { Injectable } from '@nestjs/common';
import { TWILIO } from '../../secrets';
import { twilioClient, twilio } from '../twilio.client';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class VoiceService {
  public constructor() {}

  public makeVoiceCall(mp3Param: string, recipientPhoneNr: string) {
    // Overwrite recipient phone number for testing phase
    recipientPhoneNr = TWILIO.testToNumber;

    twilioClient.calls
      .create({
        method: 'GET',
        url: voiceXmlUrl + mp3Param,
        to: recipientPhoneNr,
        from: TWILIO.testFromNumber,
      })
      .then(call => console.log('call', call.sid))
      .catch(err => {
        console.log(err);
      });
  }

  public xmlTest(response, mp3Param) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    let mp3Url: string
    for (let key in TWILIO_MP3) {
      let value = TWILIO_MP3[key];
      console.log('value: ', value);
      if (value.param === mp3Param) {
        mp3Url = value.url;
      }
    }
    twiml.play(mp3Url);
    response.type('text/xml');
    response.set('Content-Type', 'text/xml');
    return twiml.toString();
  }
}
