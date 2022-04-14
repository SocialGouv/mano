const semver = require('semver');
const fs = require('fs');
const currentVersion = require('./package.json').version;

let release = process.argv[2] || 'minor';
const validRelease = ['minor', 'major', 'patch'];
if (!validRelease.includes(release)) {
  console.error('😢 invalid release, must be ' + validRelease.join(', '));
  process.exit(1);
}

const newVersion = semver.inc(currentVersion, release);

// Replace the version in the package.json file via regex and save it
const packageJson = fs.readFileSync('package.json', 'utf8');
const newPackageJson = packageJson.replace(/"version": "[^"]+"/, `"version": "${newVersion}"`);
fs.writeFileSync('package.json', newPackageJson);

// Replace the version in the app.json file via regex and save it
const appJson = fs.readFileSync('app.json', 'utf8');
const newAppJson = appJson.replace(/"version": "[^"]+"/, `"version": "${newVersion}"`);
fs.writeFileSync('app.json', newAppJson);

// Replace the version in the android/app/build.graddle file via regex and save it
const buildGradle = fs.readFileSync('android/app/build.gradle', 'utf8');
const newBuildGradle = buildGradle.replace(/versionName "[^"]+"/, `versionName "${newVersion}"`);
fs.writeFileSync('android/app/build.gradle', newBuildGradle);

// Replace the mobileAppVersion in the ../api/package.json file via regex and save it
const apiPackageJson = fs.readFileSync('../api/package.json', 'utf8');
const newApiPackageJson = apiPackageJson.replace(/"mobileAppVersion": "[^"]+"/, `"mobileAppVersion": "${newVersion}"`);
fs.writeFileSync('../api/package.json', newApiPackageJson);

// Replace the mobileAppVersion in the ../website/package.json file via regex and save it
const websitePackageJson = fs.readFileSync('../website/package.json', 'utf8');
const newWebsitePackageJson = websitePackageJson.replace(/"mobileAppVersion": "[^"]+"/, `"mobileAppVersion": "${newVersion}"`);
fs.writeFileSync('../website/package.json', newWebsitePackageJson);

// Replace the version in the badge in ../README.md via regex and save it
const readme = fs.readFileSync('../README.md', 'utf8');
const newReadme = readme.replace(/version-(\d+\.\d+\.\d+)-blue/, `version-${newVersion}-blue`);
fs.writeFileSync('../README.md', newReadme);

console.log('🥳 Updated version to ' + newVersion);
