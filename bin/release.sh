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
if [[ -z ${AWS_ACCESS_KEY_ID:-} ]]; then error_missing_field "AWS_ACCESS_KEY_ID"; fi
if [[ -z ${AWS_SECRET_ACCESS_KEY:-} ]]; then error_missing_field "AWS_SECRET_ACCESS_KEY"; fi
if [[ -z ${AWS_SESSION_TOKEN:-} ]]; then error_missing_field "AWS_SESSION_TOKEN"; fi
if [[ -z ${AWS_REGION:-} ]]; then error_missing_field "AWS_REGION"; fi
if [[ -z ${BUCKET_NAME:-} ]]; then error_missing_field "BUCKET_NAME"; fi
if [[ -z ${DISTRIBUTION_ID:-} ]]; then error_missing_field "DISTRIBUTION_ID"; fi

git clone --single-branch --recursive \
  --branch "$RELEASE_BRANCH" \
  https://"$GITHUB_USER":"$GITHUB_ACCESS_TOKEN"@github.com/bugsnag/bugsnag-js-performance.git

cd /app/bugsnag-js-performance

# "ci" rather than "install" ensures the process doesn't make the work tree dirty by modifying lockfiles
npm ci

# check if CDN packages changed – if they didn't we don't need to upload to the CDN
BROWSER_PACKAGE_CHANGED=$(npx lerna changed --parseable | grep -c packages/platforms/browser$ || test $? = 1;)

# increment package version numbers
if [ -z "${RETRY_PUBLISH:-}" ]; then
  # ensure we don't use legacy peer deps when bumping versions (https://github.com/nrwl/nx/issues/22066)
  npm_config_legacy_peer_deps=false npx lerna version "$VERSION"  --no-push --no-private
fi

# build packages
npm run build

# push version bump commit and tags
git push --follow-tags

# publish
if [ -z "${RETRY_PUBLISH:-}" ]; then
  case $VERSION in
    "prerelease" | "prepatch" | "preminor" | "premajor")
      npx lerna publish from-git --dist-tag next
      ;;

    *)
      npx lerna publish from-git
      ;;
  esac
else
  case $VERSION in
    "prerelease" | "prepatch" | "preminor" | "premajor")
      npx lerna publish from-package --dist-tag next
      ;;

    *)
      npx lerna publish from-package
      ;;
  esac
fi

if [ "$BROWSER_PACKAGE_CHANGED" -eq 1 ] || [  -v FORCE_CDN_UPLOAD ]; then
  npm run cdn-upload
fi
