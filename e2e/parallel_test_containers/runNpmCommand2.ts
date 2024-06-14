// runNpmCommand.ts
import { promisify } from 'util';
import { exec as execCb } from 'child_process';
import path from 'path';

const exec = promisify(execCb);

export async function runNpmCommand() {

  const port = 8089;
  const serviceApiUrl = 'http://localhost:3000/api';
  // const currentDir=process.cwd();
  // const rootdir = path.resolve(currentDir, '../../');
  // process.chdir(rootdir)
  const dir="c:/work/code/121-platform"
  const command = `npm start --prefix interfaces/Portal/ -- --port ${port} > portal-server-logs1.txt 2>&1 &`;
  const options = {
    cwd: dir,
    // env: { ...process.env,  },
    NG_URL_121_SERVICE_API: serviceApiUrl
  };

  console.log(`Running command: ${command} in ${dir}`);

  try {
    const { stdout, stderr } = await exec(command, options);
    if (stdout) console.log('stdout:', stdout);
    if (stderr) console.error('stderr:', stderr);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
  }
}
