import { Injectable, HttpService } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { PORT } from '../config';

@Injectable()
export class SeedPublish implements InterfaceScript {
  host = 'http://localhost';
  address = this.host + ':' + PORT + '/api/';

  private readonly httpService = new HttpService();

  public constructor() {}

  public async run(): Promise<void> {
    console.log('Checking if 121-service is online');
    let response = await this.httpService
      .get(this.address + 'programs/country/1')
      .toPromise();

    if (response.status !== 200) {
      Error('Service is offline');
      return;
    }

    console.log('Getting all program ids');
    const responsePrograms = await this.httpService
      .get(this.address + 'programs')
      .toPromise();
    const allPrograms = responsePrograms.data.programs;

    for (let program of allPrograms) {
      let idString = program.id.toString();

      this.httpService
        .post(this.address + 'programs/publish/' + idString)
        .toPromise()
        .then(() => {
          console.log('Program ' + idString + ' has been published');
        })
        .catch(err => {
          if (err.response.status === 401) {
            console.log('Program ' + idString + ' was already published');
          } else {
            console.log(err);
            Error('Something went wrong while publishing program ' + idString);
          }
        });
    }
  }
}
export default SeedPublish;
