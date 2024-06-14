import { execSync,ExecSyncOptions  } from 'child_process';

export function runNpmCommand() {
  const port = 8090;
  const serviceApiUrl = 'http://localhost:3000/api';
  const dir = 'c:/work/code/121-platform';
  const command = `npm start --prefix interfaces/Portal/ -- --port ${port}`;
  const options: ExecSyncOptions = {
    cwd: dir,
    env: { ...process.env, NG_URL_121_SERVICE_API: serviceApiUrl },
    stdio: 'inherit', // Ensures output is displayed in the console
  };

  console.log(`Running command: ${command} in ${dir}`);

  try {
    execSync(command, options);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
  }
}
