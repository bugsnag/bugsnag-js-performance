#!/usr/bin/env bash

set -euxo pipefail

error_missing_field () {
  echo "Missing required env var: $1"
  exit 1
}

# Ensure all required variables are set before doing any work
if [[ -z ${GITHUB_USER:-} ]]; then error_missing_field 'GITHUB_USER'; fi
if [[ -z ${GITHUB_ACCESS_TOKEN:-} ]]; then error_missing_field "GITHUB_ACCESS_TOKEN"; fi
if [[ -z ${RELEASE_BRANCH:-} ]]; then error_missing_field "RELEASE_BRANCH"; fi
if [[ -z ${VERSION:-} ]]; then error_missing_field "VERSION"; fi

git clone --single-branch --recursive \
  --branch "$RELEASE_BRANCH" \
  https://"$GITHUB_USER":"$GITHUB_ACCESS_TOKEN"@github.com/bugsnag/bugsnag-js-performance.git

cd /app/bugsnag-js-performance

# "ci" rather than "install" ensures the process doesn't make the work tree dirty by modifying lockfiles
npm ci

# increment package version numbers
if [ -z "${RETRY_PUBLISH:-}" ]; then
  case $VERSION in
    "prerelease" | "prepatch" | "preminor" | "premajor")
      npx lerna version "$VERSION" --dist-tag next --no-push
      ;;

    *)
      npx lerna version "$VERSION" --no-push
      ;;
  esac
fi

# build packages
npm run build

# push git tags
git push origin --tags

# publish
if [ -z "${RETRY_PUBLISH:-}" ]; then
  npx lerna publish from-git
else
  npx lerna publish from-package
fi
