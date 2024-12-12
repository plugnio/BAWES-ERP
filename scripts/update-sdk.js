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
    // Ensure tmp-sdk exists
    if (!fs.existsSync(TMP_SDK_DIR)) {
      throw new Error('tmp-sdk directory not found. Please run generate:sdk first');
    }

    // Clean up any existing SDK repo directory
    if (fs.existsSync(SDK_DIR)) {
      fs.rmSync(SDK_DIR, { recursive: true, force: true });
    }

    // Clone SDK repository
    exec(`git clone ${SDK_REPO} ${SDK_DIR}`);
    process.chdir(SDK_DIR);
    exec(`git checkout ${SDK_BRANCH}`);

    // Create src directory if it doesn't exist
    if (!fs.existsSync(path.join(SDK_DIR, 'src'))) {
      fs.mkdirSync(path.join(SDK_DIR, 'src'));
    }

    // Copy TypeScript files from tmp-sdk to sdk-repo/src
    const files = fs.readdirSync(TMP_SDK_DIR);
    files.forEach(file => {
      if (file.endsWith('.ts')) {
        fs.copyFileSync(
          path.join(TMP_SDK_DIR, file),
          path.join(SDK_DIR, 'src', file)
        );
      }
    });
    
    // Copy package.json but preserve version
    const currentPkg = JSON.parse(fs.readFileSync(path.join(SDK_DIR, 'package.json'), 'utf8'));
    const newPkg = JSON.parse(fs.readFileSync(path.join(TMP_SDK_DIR, 'package.json'), 'utf8'));
    newPkg.version = currentPkg.version;
    fs.writeFileSync(path.join(SDK_DIR, 'package.json'), JSON.stringify(newPkg, null, 2));

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