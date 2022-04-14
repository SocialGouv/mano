const chalk = require('chalk');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const mobileAppVersion = require('./package.json').version;

// Before running the script
// To authenticate, please run `gh auth login`.

const publishAppToLatestTag = async () => {
  const result = await exec(`gh release create m${mobileAppVersion} ./android/app/build/outputs/apk/release/app-release.apk`);

  if (result.stderr?.length) {
    console.log(chalk.red('Error uploading app:'), chalk.bgRed(result.stderr));
    return;
  }
  if (result.stdout?.length) {
    console.log(chalk.green('Success uploading app:'), chalk.bgRed(result.stdout));
    return;
  }

  await exec(`gh release upload m${mobileAppVersion} ./app.json`);

  console.log(chalk.yellow('Transfer completed 😬: https://mano-app.fabrique.social.gouv.fr/download'));
};

publishAppToLatestTag();
