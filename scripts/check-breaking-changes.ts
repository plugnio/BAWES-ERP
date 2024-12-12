import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

async function getLastPublishedVersion(): Promise<string> {
  try {
    const { stdout } = await execAsync('git describe --tags --abbrev=0');
    return stdout.trim();
  } catch {
    return 'HEAD~1'; // Fallback to previous commit if no tags exist
  }
}

async function saveSwaggerSnapshot(version: string): Promise<string> {
  const tempFile = path.join(__dirname, `../swagger-${version}.json`);
  
  try {
    await execAsync(`git show ${version}:swagger.json > ${tempFile}`);
    return tempFile;
  } catch (error) {
    console.error(`Failed to get swagger.json from ${version}:`, error);
    process.exit(1);
  }
}

async function main() {
  const lastVersion = await getLastPublishedVersion();
  const oldSwaggerFile = await saveSwaggerSnapshot(lastVersion);
  const currentSwaggerFile = path.join(__dirname, '../swagger.json');

  try {
    const { stdout } = await execAsync(
      `npx openapi-diff ${oldSwaggerFile} ${currentSwaggerFile}`
    );

    // Clean up temp file
    fs.unlinkSync(oldSwaggerFile);

    if (stdout.includes('BREAKING')) {
      console.log('⚠️ Breaking changes detected:');
      console.log(stdout);
      process.exit(1);
    } else if (stdout.includes('NON-BREAKING')) {
      console.log('ℹ️ Non-breaking changes detected:');
      console.log(stdout);
    } else {
      console.log('✅ No API changes detected');
    }
  } catch (error) {
    console.error('Failed to compare swagger files:', error);
    process.exit(1);
  }
}

main().catch(console.error); 