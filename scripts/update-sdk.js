const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SDK_REPO = 'git@github.com:plugnio/BAWES-ERP-sdk.git';
const SDK_BRANCH = 'main';
const TMP_SDK_DIR = path.join(process.cwd(), 'tmp-sdk');
const SDK_DIR = path.join(process.cwd(), 'sdk-repo');

function exec(command) {
  console.log(`Executing: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error updating SDK: ${error}`);
    process.exit(1);
  }
}

async function main() {
  try {
    // Debug: Log current directory and paths
    console.log('Current directory:', process.cwd());
    console.log('TMP_SDK_DIR:', TMP_SDK_DIR);
    console.log('SDK_DIR:', SDK_DIR);

    // Ensure tmp-sdk exists
    if (!fs.existsSync(TMP_SDK_DIR)) {
      console.error('tmp-sdk directory not found at:', TMP_SDK_DIR);
      throw new Error('tmp-sdk directory not found. Please run generate:sdk first');
    }

    // Debug: Log tmp-sdk contents
    console.log('tmp-sdk contents:', fs.readdirSync(TMP_SDK_DIR));

    // Clean up any existing SDK repo directory
    if (fs.existsSync(SDK_DIR)) {
      fs.rmSync(SDK_DIR, { recursive: true, force: true });
    }

    // Clone SDK repository
    exec(`git clone ${SDK_REPO} ${SDK_DIR}`);
    process.chdir(SDK_DIR);
    exec(`git checkout ${SDK_BRANCH}`);

    // Debug: Log current directory after chdir
    console.log('Current directory after chdir:', process.cwd());

    // Create src directory if it doesn't exist
    if (!fs.existsSync(path.join(SDK_DIR, 'src'))) {
      fs.mkdirSync(path.join(SDK_DIR, 'src'));
    }

    // Debug: Log files to be copied
    const files = fs.readdirSync(TMP_SDK_DIR);
    console.log('Files to copy:', files);

    // Copy TypeScript files from tmp-sdk to sdk-repo/src
    files.forEach(file => {
      if (file.endsWith('.ts')) {
        const srcPath = path.join(TMP_SDK_DIR, file);
        const destPath = path.join(SDK_DIR, 'src', file);
        console.log(`Copying ${srcPath} to ${destPath}`);
        fs.copyFileSync(srcPath, destPath);
      }
    });

    // Commit and tag changes 
    exec('git add .');
    try {
      exec('git commit -m "chore: update SDK"');
      // Increment patch version
      exec('npm version patch');
    } catch (e) {
      console.log('No changes to commit');
    }

    console.log('SDK update complete!');
  } catch (error) {
    console.error('Error updating SDK:', error);
    process.exit(1);
  }
}

main(); 