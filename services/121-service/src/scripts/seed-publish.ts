import { Type } from 'class-transformer';
import { Injectable, HttpService } from "@nestjs/common";

import { InterfaceScript } from "./scripts.module";
import { PORT } from "../config";

@Injectable()
export class SeedPublish implements InterfaceScript {
  host = 'http://localhost';
  address = this.host + ':' + PORT + '/api/'
  private readonly httpService = new HttpService();

  public constructor() { }
  public async run(): Promise<void> {
    console.log('Checking if 121 service is online');
    const apiStringCheck = this.address + 'programs/country/1';
    let response = await this.httpService.get(apiStringCheck).toPromise();
    if (response.status !== 200) {
      Error('Service is offline')
    }

    console.log('Getting all program ids');
    const apiStringAllPrograms = this.address + 'programs';
    const responsePrograms = await this.httpService.get(apiStringAllPrograms).toPromise();
    const allPrograms = responsePrograms.data
    const allProgramsObject = allPrograms.programs


    for (let program of allProgramsObject) {
      let idString = program.id.toString()
      let apiStringPublish = this.address + 'programs/publish/' + idString;
      this.httpService.post(apiStringPublish).toPromise().then((res) => {
        console.log('Program ' + idString + ' has been published')
      }).catch((err) => {
        if (err.response.status === 401) {
          console.log('Program ' + idString + ' was already published');
        } else {
          console.log(err)
          Error('Something went wrong while publishing program ' + idString);
        }
      })
    }
  }
}
export default SeedPublish;
