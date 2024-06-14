import { spawn,SpawnOptions } from 'child_process';

export async function runNpmCommand(port: number, serviceApiUrl: string): Promise<void> {
  const dir = "c:/work/code/121-platform";
  const command = 'npm';
  const args = [
    'start',
    '--prefix',
    'interfaces/Portal/',
    '--',
    '--port',
    port.toString()
  ];
  const logFile = 'portal-server-logs.txt';

  // Prepare the options with the environment variable
  const options: SpawnOptions = {
    cwd: dir,
    env: { ...process.env, NG_URL_121_SERVICE_API: serviceApiUrl },
    stdio: 'ignore', // Ignore stdio to prevent blocking
    detached: true, // Detach the child process
    shell: true // Use the shell to interpret the command
  };


  console.log(`Running command: ${command} ${args.join(' ')} in ${dir}`);

  // Redirect stdout and stderr to the same log file and run the command in the background
  spawn(command, args.concat(`> ${logFile} 2>&1`), options);
}

// Example usage
// (async () => {
//   const port = 8099;
//   const serviceApiUrl = 'http://localhost:3000/api';
//   await runNpmCommand(port, serviceApiUrl);
// })();
