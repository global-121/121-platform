import axios, { AxiosResponse } from 'axios';
import { SeedScript } from '../../../../src/scripts/seed-script.enum';

export function getHostname(): string {
  return 'http://localhost:3000/api';
}

export function resetDB(seedScript: SeedScript): Promise<AxiosResponse> {
  const url = `${getHostname()}/scripts/reset?script=${seedScript}&mockPv=true&mockOcw=true&isApiTests=false`;
  const requestData = {
    script: seedScript,
    isApiTests: true,
    secret: "fill_in_secret",
  };

  return axios.post(url, requestData);
}

// import * as request from 'supertest';
// import { TestAgent } from 'supertest';
// import { SeedScript } from '../../../../src/scripts/seed-script.enum';

// export function getHostname(): string {
//   return 'http://localhost:3000/api';
// }

// export function getServer(): TestAgent<request.Test> {
//   return request.agent(getHostname());
// }

// export function resetDB(seedScript: SeedScript) {
//   const url = `${getHostname()}/scripts/reset?script=${seedScript}&mockPv=true&mockOcw=true&isApiTests=false`;
//   const requestData = {
//     secret: process.env.RESET_SECRET || "fill_in_secret",
//   };
//     const response = fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(requestData),
//     });
//     console.log(response);

// }
