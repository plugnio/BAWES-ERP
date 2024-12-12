const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SDK_REPO = 'git@github.com:plugnio/BAWES-ERP-sdk.git';
const SDK_BRANCH = 'main';
const TMP_SDK_DIR = path.join(process.cwd(), 'tmp-sdk');
const SDK_DIR = path.join(process.cwd(), 'sdk-repo');
const SDK_CONFIG_DIR = path.join(process.cwd(), 'sdk');

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
    // Clone SDK repository
    exec(`git clone ${SDK_REPO} ${SDK_DIR}`);
    process.chdir(SDK_DIR);
    exec(`git checkout ${SDK_BRANCH}`);

    // Copy SDK configuration files from backend repo
    fs.cpSync(SDK_CONFIG_DIR, SDK_DIR, { recursive: true });

    // Create src directory if it doesn't exist
    const srcDir = path.join(SDK_DIR, 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir);
    }

    // Copy TypeScript files from tmp-sdk to sdk-repo/src
    const files = fs.readdirSync(TMP_SDK_DIR);
    files.forEach(file => {
      if (file.endsWith('.ts')) {
        const srcPath = path.join(TMP_SDK_DIR, file);
        const destPath = path.join(srcDir, file);
        fs.copyFileSync(srcPath, destPath);
      }
    });

    // Commit changes and push
    exec('git add .');
    exec('git commit -m "chore: update SDK"');
    exec('git push origin main');

    console.log('SDK update complete!');
  } catch (error) {
    console.error('Error updating SDK:', error);
    process.exit(1);
  }
}

main(); 