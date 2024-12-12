const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SDK_REPO = 'git@github.com:bawes/erp-sdk.git';
const SDK_BRANCH = 'main';
const TMP_SDK_DIR = path.join(__dirname, '../tmp-sdk');
const SDK_DIR = path.join(__dirname, '../sdk-repo');

function exec(command, options = {}) {
  console.log(`Executing: ${command}`);
  return execSync(command, { stdio: 'inherit', ...options });
}

async function main() {
  try {
    // Clean up any existing SDK repo directory
    if (fs.existsSync(SDK_DIR)) {
      fs.rmSync(SDK_DIR, { recursive: true, force: true });
    }

    // Clone the SDK repository
    exec(`git clone ${SDK_REPO} ${SDK_DIR}`);
    process.chdir(SDK_DIR);
    exec(`git checkout ${SDK_BRANCH}`);

    // Copy new SDK files
    fs.rmSync(path.join(SDK_DIR, 'src'), { recursive: true, force: true });
    fs.cpSync(path.join(TMP_SDK_DIR, 'src'), path.join(SDK_DIR, 'src'), { recursive: true });
    
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

    // Clean up temporary directory
    fs.rmSync(TMP_SDK_DIR, { recursive: true, force: true });

    console.log('SDK update complete!');
    console.log('To publish changes:');
    console.log('1. cd sdk-repo');
    console.log('2. Review changes: git status');
    console.log('3. Push changes: git push && git push --tags');
  } catch (error) {
    console.error('Error updating SDK:', error);
    process.exit(1);
  }
}

main(); 