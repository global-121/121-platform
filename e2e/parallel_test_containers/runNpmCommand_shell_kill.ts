import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function runNpmCommand(port: number, serviceApiUrl: string): Promise<ChildProcess | null> {
  // const dir = "c:/work/code/121-platform";
  const currentDir = process.cwd(); // Get the current working directory
  const dir = path.resolve(currentDir, '../');
  const command = `npm`;
  const args = ['start', '--prefix', 'interfaces/Portal/', '--', '--port', port.toString()];

  // Prepare the options with the environment variable
  const options = {
    cwd: dir,
    env: { ...process.env, NG_URL_121_SERVICE_API: serviceApiUrl },
    shell: true,
    detached: false, // To let the process run independently
    stdio: ['ignore', 'ignore', 'ignore'] // Ignore stdio to allow the process to run independently
  };

  console.log(`Running command: ${command} ${args.join(' ')} in ${dir}`);

  const out = fs.openSync('portal-server-logs1.txt', 'a');
  const err = fs.openSync('portal-server-logs1.txt', 'a');

  const child = spawn(command, args, {
    ...options,
    stdio: ['ignore', out, err]
  });

  if (child.pid) {
    child.unref(); // Detach the process
    console.log(`Command started with PID: ${child.pid}`);
    return child;
  } else {
    console.error('Failed to start the npm command');
    return null;
  }
}

export async function stopNpmCommand(child: ChildProcess|undefined): Promise<void> {
  // if (child.pid) {
  //   console.log(`Stopping command with PID: ${child.pid}`);
  //   child.kill('SIGTERM'); // Kill the process
  // } else {
  //   console.error('Cannot stop npm command: invalid PID');
  // }
  if (child && child.pid) {
    try {
      console.log(child.pid);
      process.kill(child.pid, 'SIGKILL'); // Send SIGKILL signal to the process

      process.kill(-child.pid); // Use -PID to kill the process group
      console.log(`Stopped process with PID: ${child.pid}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
        console.error('Process not found.');
      } else {
        console.error(`Error stopping process: ${(error as NodeJS.ErrnoException).message}`);
      }
    } finally {
      child = undefined;
    }
  } else {
    console.error('No running process to stop.');
  }
}

// Example usage
// (async () => {
//   const port = 8099;
//   const serviceApiUrl = 'http://localhost:3000/api';
//   const child = await runNpmCommand(port, serviceApiUrl);

//   if (child) {
//     // Wait for some time or perform tests
//     // For example, we wait for 60 seconds
//     await new Promise(resolve => setTimeout(resolve, 60000));

//     // Stop the npm process
//     await stopNpmCommand(child);
//   } else {
//     console.error('Failed to run npm command.');
//   }
// })();
