import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function runNpmCommand(
  port: number,
  serviceApiUrl: string,
): Promise<ChildProcess | null> {
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
      const pidFilePath = 'process.pid';
      fs.writeFileSync(pidFilePath, `${child.pid}\n`);
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
