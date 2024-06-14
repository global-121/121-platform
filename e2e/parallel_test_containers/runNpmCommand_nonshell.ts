import { spawn, ChildProcess, SpawnOptions } from 'child_process';

export async function runNpmCommand(port: number, serviceApiUrl: string): Promise<ChildProcess | null> {
  const dir = "c:/work/code/121-platform";
  const command = `npm`;
  const args = ['start', '--prefix', 'interfaces/Portal/', '--', '--port', port.toString()];

  // Prepare the options with the environment variable
  const options: SpawnOptions = {
    cwd: dir,
    env: { ...process.env, NG_URL_121_SERVICE_API: serviceApiUrl },
    stdio: 'inherit'
  };

  console.log(`Running command: ${command} ${args.join(' ')} in ${dir}`);

  const child = spawn(command, args, options);

  if (child.pid) {
    console.log(`Command started with PID: ${child.pid}`);
    return child;
  } else {
    console.error('Failed to start the npm command');
    return null;
  }
}

export async function stopNpmCommand(child: ChildProcess): Promise<void> {
  if (child.pid) {
    console.log(`Stopping command with PID: ${child.pid}`);
    child.kill('SIGTERM'); // Kill the process
  } else {
    console.error('Cannot stop npm command: invalid PID');
  }
}

// Example usage
(async () => {
  let child: ChildProcess | null = null;

  try {
    const port = 8099;
    const serviceApiUrl = 'http://localhost:3000/api';
    child = await runNpmCommand(port, serviceApiUrl);

    if (child) {
      // Wait for some time or perform tests
      // For example, we wait for 60 seconds
      await new Promise(resolve => setTimeout(resolve, 60000));
    } else {
      console.error('Failed to run npm command.');
    }
  } finally {
    if (child) {
      // Stop the npm process
      await stopNpmCommand(child);
    }
  }
})();
