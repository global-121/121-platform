import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import treeKill from 'tree-kill';
import util from 'util';

const exec = util.promisify(require('child_process').exec);

export async function runNpmCommand(
  port: number,
  serviceApiUrl: string,
): Promise<ChildProcess | null> {
  // const dir = "c:/work/code/121-platform";
  const currentDir = process.cwd(); // Get the current working directory
  const dir = path.resolve(currentDir, '../');
  const command = `npm`;
  // let child: ChildProcess | null = null;
  const args = [
    'start',
    '--prefix',
    'interfaces/Portal/',
    '--',
    '--port',
    port.toString(),
  ];

  // Prepare the options with the environment variable
  const options = {
    cwd: dir,
    env: { ...process.env, NG_URL_121_SERVICE_API: serviceApiUrl },
    shell: true,
    detached: true, // To let the process run independently
    stdio: ['ignore', 'ignore', 'ignore'], // Ignore stdio to allow the process to run independently
  };

  console.log(`Running command: ${command} ${args.join(' ')} in ${dir}`);

  const out = fs.openSync('portal-server-logs1.txt', 'a');
  const err = fs.openSync('portal-server-logs1.txt', 'a');

  try {
    const child = spawn(command, args, {
      ...options,
      stdio: ['ignore', out, err],
    });

    if (child.pid) {
      console.log(`Started process with PID: ${child.pid}`);
      fs.writeFileSync('process.pid', child.pid.toString());
      return child;
    } else {
      throw new Error('Failed to start child process.');
    }
  } catch (error) {
    console.error(
      `Error starting process: ${error instanceof Error ? error.message : error}`,
    );
  }
  return null;
}

export async function stopNpmCommand(
  child: ChildProcess | null,
): Promise<void> {
  try {
    const pid = fs.readFileSync('process.pid', 'utf-8');
    console.log(pid)
    if (pid) {
      // Wait for one minute (60,000 milliseconds)
      setTimeout(() => {
        console.log('One minute has passed. Child process is now running.');
      }, 6000);
      treeKill(parseInt(pid), 'SIGKILL', (err) => {
         console.log(pid)
        if (err) {
          if ((err as NodeJS.ErrnoException).code === 'ESRCH') {
            console.error('Process already terminated.');
          } else {
            console.error(`Error stopping process: ${(err as Error).message}`);
          }
        } else {
          console.log(`Stopped process with PID: ${pid}`);
        }
      });
    } else {
      console.log('Process ID not found.');
    }
    fs.unlinkSync('process.pid');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error('Process not found.');
    } else {
      console.error(`Error stopping process: ${(error as Error).message}`);
    }
  } finally {
    child = null;
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
