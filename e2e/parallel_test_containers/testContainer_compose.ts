import { SpawnOptions, execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import {
  DockerComposeEnvironment,
  PullPolicy,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';
// import { promisify } from 'util';

let environment: StartedDockerComposeEnvironment;
const composeFilePath = path.resolve(__dirname, './'); // '../../../../services'; // Adjust the path as needed
const composeFileName = 'docker-compose.test.yml';
const envFilePath = path.resolve(composeFilePath, '.env');
const backupEnvFilePath = path.resolve(composeFilePath, '.env.backup');

async function startEnvironment(): Promise<number> {
  // let servicePort: number;
  // servicePort = 3000;
  const servicePort = await startService();
  //start up portal
  const portalPort = await startPortal(servicePort);
  return portalPort;
}

async function startService(): Promise<number> {
  // Step 1: Start 121db and 121-redis services
  environment = await new DockerComposeEnvironment(
    composeFilePath,
    composeFileName,
  )
    .withPullPolicy(PullPolicy.alwaysPull())
    .withNoRecreate()
    .withWaitStrategy(
      '121db',
      Wait.forLogMessage('ready to accept connections', 1),
    )
    .up();

  // Step 2: Fetch dynamically assigned ports for 121db and 121-redis
  const dbContainer = environment.getContainer('121db');
  const redisContainer = environment.getContainer('121queue');
  const serviceContainer = environment.getContainer('121-service');
  const mockServiceContainer = environment.getContainer('mock-service');

  const dbPort = dbContainer.getFirstMappedPort();
  const redisPort = redisContainer.getFirstMappedPort();
  const mockServicePort = mockServiceContainer.getFirstMappedPort();
  console.log(`Database Port: ${dbPort}`);
  console.log(`Redis Port: ${redisPort}`);

  // Step 3: Update the environment variables for the 121-service container

  fs.copyFileSync(envFilePath, backupEnvFilePath);
  updateEnvWithPorts(dbPort, redisPort, mockServicePort);
  // Restart the 121-service container with the updated environment variables
  try {
    // Restart the 121-service container
    await environment.getContainer('121-service').restart();

    console.log('121-service container restarted successfully.');
  } catch (error) {
    console.error('Error restarting 121-service container:', error);
  }

  // Wait for the 121-service to be healthy
  const servicePort = serviceContainer.getFirstMappedPort();
  await waitForServer(`http://localhost:${servicePort}/docs/`);
  return servicePort;
}

async function startPortal(servicePort: number): Promise<number> {
  const currentDir = process.cwd();
  console.log('currentDir' + currentDir);
  const interfaceDir = path.resolve(currentDir, '../interfaces/Portal');
  console.log('interfaceDir' + interfaceDir);
  const rootdir = path.resolve(currentDir, '../');
  console.log('rootdir' + rootdir);
  process.chdir(interfaceDir);
  console.log('currentDir' + process.cwd());

  // Install dependencies
  execSync('npm install', { stdio: 'inherit' });

  // Check if default port is available otherwise find one
  const port = await checkPort(8088);
  console.log(`Port ${port} is available`);

  const serviceApiUrl = `http://localhost:${servicePort}/api`;
  // process.chdir(rootdir);
  const currentDir2 = process.cwd();
  console.log('2:' + currentDir2);
  // const command = `NG_URL_121_SERVICE_API=${serviceApiUrl} npm run build:prod && npx http-server ./www/ -c30 --gzip --brotli --port ${port} > portal-server-logs.txt 2>&1 &`;
  // const command = `NG_URL_121_SERVICE_API=${serviceApiUrl} npm start --prefix interfaces/Portal/ -- --port  ${port}`;
  const command = `npm start --prefix  -- --port  ${port}`;
  const options = {
    cwd: rootdir,
    env: { ...process.env, NG_URL_121_SERVICE_API: serviceApiUrl },
  };

  // exec(command, options, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`Error: ${error.message}`);
  //     return;
  //   }
  //   if (stderr) {
  //     console.error(`stderr: ${stderr}`);
  //     return;
  //   }
  //   console.log(`stdout: ${stdout}`);
  // });

  try {
    await runNpmCommand('npm', [command], options);
    console.log('npm  completed successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred');
    }
  }

  // const exec = promisify(execCallback);
  // try {
  //   const { stdout, stderr } = await exec(command, options);
  //   console.log(`stdout: ${stdout}`);
  //   console.error(`stderr: ${stderr}`);
  // } catch (error) {
  //   if (error instanceof Error) {
  //     console.error(`Error: ${error.message}`);
  //   } else {
  //     console.error('An unknown error occurred');
  //   }
  // }
  // Wait for the server to be up and running
  process.chdir(currentDir);
  await waitForServer(`http://localhost:${port}`);
  return port;
}

async function stopEnvironment() {
  if (environment) {
    await environment.stop();
  }
  fs.copyFileSync(backupEnvFilePath, envFilePath);
}

async function waitForServer(
  url?: string,
  timeout = 240000,
  interval = 5000,
): Promise<boolean> {
  const start = Date.now();

  if (url === undefined) {
    console.error('URL is undefined');
    return false;
  }

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`Server at ${url} is available.`);
        return true;
      }
    } catch (error) {
      console.log(`Waiting for server at ${url}...`);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  throw new Error(
    `Server at ${url} did not become available within ${timeout}ms`,
  );
}

// Function to update .env file with mapped ports
function updateEnvWithPorts(
  postgresPort: number,
  redisPort: number,
  mockServicePort: number,
) {
  try {
    // Read the contents of the .env file
    const envContent = fs.readFileSync(envFilePath, 'utf8');

    // Split the content into lines
    const lines = envContent.split('\n');

    // Update the POSTGRES_PORT, REDIS_PORT, and MOCK_SERVICE_URL values
    let updatedEnvContent = '';
    for (const line of lines) {
      if (line.startsWith('POSTGRES_PORT=')) {
        updatedEnvContent += `POSTGRES_PORT=${postgresPort}\n`;
      } else if (line.startsWith('REDIS_PORT=')) {
        updatedEnvContent += `REDIS_PORT=${redisPort}\n`;
      } else if (line.startsWith('MOCK_SERVICE_URL=')) {
        updatedEnvContent += `MOCK_SERVICE_URL=http://mock-service:${mockServicePort}/\n`;
      } else {
        updatedEnvContent += `${line}\n`;
      }
    }

    // Write the updated content back to the .env file
    fs.writeFileSync('.env', updatedEnvContent);

    console.log('.env file updated successfully with mapped ports.');
  } catch (err) {
    console.error('Error updating .env file:', err);
  }
}
// function checkPort(port: number): Promise<number> {
//   return new Promise((resolve, reject) => {
//     const server = net.createServer();

//     server.once('error', (err: NodeJS.ErrnoException) => {
//       if (err.code === 'EADDRINUSE') {
//         server.close();
//         checkPort(port + 1)
//           .then(resolve)
//           .catch(reject);
//       } else {
//         reject(err);
//       }
//     });

//     server.once('listening', () => {
//       server.close();
//       resolve(port);
//     });

//     server.listen(port);
//   });
// }
async function checkPort(port: number): Promise<number> {
  while (true) {
    try {
      await tryPort(port);
      return port;
    } catch (err) {
      if (isErrnoException(err) && err.code === 'EADDRINUSE') {
        port++;
      } else {
        throw err;
      }
    }
  }
}
function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
function tryPort(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      server.close();
      reject(err);
    });

    server.once('listening', () => {
      server.close();
      resolve();
    });

    server.listen(port);
  });
}

async function runNpmCommand(
  command: string,
  args: string[],
  options?: SpawnOptions,
) {
  return new Promise<void>((resolve, reject) => {
    const npmProcess = spawn(command, args, { stdio: 'inherit', ...options });

    npmProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm command '${command}' failed with code ${code}`));
      }
    });

    npmProcess.on('error', (err) => {
      reject(err);
    });
  });
}

export { startEnvironment, stopEnvironment, waitForServer };

// (async () => {
//   try {
//     await startEnvironment(
//       '/path/to/your/docker-compose',
//       'docker-compose.yml',
//     );
//   } catch (error) {
//     console.error(error);
//   } finally {
//     await stopEnvironment();
//   }
// })();
