const { execSync } = require('child_process');
const packages = require('./packages.json');

console.log("Detecting changes to determine which pipelines to upload...");

const ignoredFiles = ["README.md", "LICENSE.txt", ".gitignore", "TESTING.md", "osv-scanner.toml"];

const baseBranch = process.env.BUILDKITE_PULL_REQUEST_BASE_BRANCH;
const currentBranch = process.env.BUILDKITE_BRANCH;
const commitMessage = process.env.BUILDKITE_MESSAGE || "";
const isFullBuild = process.env.FULL_SCHEDULED_BUILD === "1";

if (baseBranch) {
  console.log(`Fetching latest changes from ${baseBranch}`);
  execSync(`git fetch origin ${baseBranch}`);

  console.log(`Files changed in ${currentBranch} compared to ${baseBranch}:`);
  execSync(`git --no-pager diff --name-only origin/${baseBranch}`, { stdio: 'inherit' });
}

packages.reverse().forEach(({ paths, block, pipeline, environment, skip }) => {
  let upload = false;
  const env = environment || "";

  if (skip) {
    console.log(`Skipping pipeline ${pipeline} as per configuration.`);
    return;
  }

  // Upload all pipelines if specified in the commit message
  if (commitMessage.includes("[full ci]") ||
    isFullBuild ||
    currentBranch === "main" ||
    baseBranch === "main") {
    console.log(`Upload pipeline file: ${pipeline} with environment: '${env}'`);
    execSync(`${env} buildkite-agent pipeline upload ${pipeline}`);
    return;
  }

  if (!baseBranch) {
    console.log(`No pull request raised, uploading blocker file: ${block}`);
    execSync(`buildkite-agent pipeline upload ${block}`);
    return;
  }

  const changedFiles = execSync(`git diff --name-only origin/${baseBranch}`).toString().split('\n');

  for (const file of changedFiles) {
    if (ignoredFiles.includes(file)) {
      console.log(`Skipping ${file} based on ignored_files list`);
      continue;
    }

    for (const path of paths) {
      if (file.includes(path)) {
        console.log(`file ${file} is in ${path}, mark pipeline for upload`);
        upload = true;
        break;
      }
    }

    if (upload) break;
  }

  if (upload) {
    console.log(`Upload pipeline file: ${pipeline} with environment: '${env}'`);
    execSync(`${env} buildkite-agent pipeline upload ${pipeline}`);
  } else {
    console.log(`Upload blocker file: ${block}`);
    execSync(`buildkite-agent pipeline upload ${block}`);
  }
});
