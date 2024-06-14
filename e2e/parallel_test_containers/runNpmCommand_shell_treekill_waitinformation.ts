import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import treeKill from 'tree-kill';

export async function runNpmCommand(
  port: number,
  serviceApiUrl: string,
  timeoutMillis: number = 20000, // Default timeout: 2 minutes
): Promise<ChildProcess | null> {
  const currentDir = process.cwd(); // Get the current working directory
  const dir = path.resolve(currentDir, '../');
  const command = `npm`;
  const args = [
    'start',
    '--prefix',
    'interfaces/Portal/',
    '--',
    '--port',
    port.toString(),
  ];

  console.log(`Running command: ${command} ${args.join(' ')} in ${dir}`);

  const out = fs.openSync('portal-server-logs1.txt', 'a');
  const err = fs.openSync('portal-server-logs1.txt', 'a');

  // Start the child process
  const child = spawn(command, args, {
    cwd: dir,
    env: { ...process.env, NG_URL_121_SERVICE_API: serviceApiUrl },
    shell: true,
    detached: false, // To let the process run independently
    stdio: ['pipe', 'pipe', 'pipe'], // Capture the output of the command
  });

  // Create a promise that resolves when the specific message is found or when an error occurs
  const childProcessPromise = new Promise<void>((resolve, reject) => {
    child.stdout?.on('data', (data) => {
      const output = data.toString();
    });

    child.stderr?.on('data', (data) => {
      const error = data.toString();
      // console.error(`Error: ${error}`);
      // reject(new Error(error));
      console.log(error);
      if (error.includes('Browser application bundle generation complete.')) {
        console.log('Shell command window shows: Compiled successfully');
        resolve();
      }
    });

    child.on('exit', (code) => {
      console.log(`Child process exited with code ${code}`);
      reject(new Error(`Child process exited with code ${code}`));
    });

    child.on('error', (err) => {
      reject(err);
    });
  });

  if (child.pid) {
    console.log(`Started process with PID: ${child.pid}`);
    fs.writeFileSync('process.pid', child.pid.toString());

    // Create a timeout promise
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Timeout reached: Compiled message not found');
        resolve();
      }, timeoutMillis);
    });

    // Use Promise.race() to race between the child process promise and the timeout promise
    await Promise.race([childProcessPromise, timeoutPromise]);

    // Return the child process
    return child;
  } else {
    console.error('Failed to start child process.');
    return null;
  }
}

function childProcessPromise(child: ChildProcess): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    child.on('exit', () => {
      resolve();
    });
    child.on('error', (err) => {
      reject(err);
    });
  });
}

export async function stopNpmCommand(
  child: ChildProcess | null,
): Promise<void> {
  try {
    if (child && child.pid) {
      console.log(`Stopping shell process with PID: ${child.pid}`);
      let childPid = child.pid;
      treeKill(childPid, 'SIGKILL', (err) => {
        if (err) {
          console.error(`Error stopping shell process: ${err}`);
        } else {
          console.log(`Stopped shell process with PID: ${childPid}`);
        }
      });

      // Wait for a brief moment to allow the shell process to clean up
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check if there are any child processes spawned by the shell
      const pidFilePath = 'process.pid';
      const childProcessPids = fs
        .readFileSync(pidFilePath, 'utf-8')
        .split('\n')
        .map(Number);

      // Terminate each child process
      childProcessPids.forEach((pid) => {
        treeKill(pid, 'SIGKILL', (err) => {
          if (err) {
            console.error(
              `Error stopping child process with PID ${pid}: ${err}`,
            );
          } else {
            console.log(`Stopped child process with PID: ${pid}`);
          }
        });
      });
      // Clean up the PID file
      fs.unlinkSync(pidFilePath);
    }
  } catch (error) {
    console.error(`Error stopping npm command: ${error}`);
  }
}
