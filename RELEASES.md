## Releases

```mermaid
graph TD;
    main-->next;
    next-->PLAT-1234-new-feature;
    PLAT-1234-new-feature-. PR .->next;
    next-->release/v1.2.3;
    release/v1.2.3-. PR .->main;
```

### Enhancements and bugfixes

- decide on a new version number, following [semantic versioning](https://semver.org/)
- create a new release branch based on `next` with the new version number in the branch name i.e. `release/vX.Y.Z`
- update the version number and date in the changelog
- make a PR from your release branch to the `main` branch entitled Release vX.Y.Z
- get the release PR reviewed – all code changes should have been reviewed already, this should be a review of the integration of all changes to be shipped and the updates to the changelog
- consider shipping a [prerelease](#prereleases) to aid testing the release

Once the release PR has been approved:

- merge the PR

You are now ready to make the release. Releases are done using Docker and Docker compose. You do not need to have the release branch checked out on your local machine to make a release – the container pulls a fresh clone of the repo down from GitHub. Prerequisites:

- You will need to clone the repository and have Docker running on your local machine.
- Ensure you are logged in to npm and that you have access to publish any packages in the `@bugsnag` namespace
- Ensure your `.gitconfig` file in your home directory is configured to contain your name and email address
- Generate a [personal access token](https://github.com/settings/tokens/new) on GitHub and store it somewhere secure

Build the release container:

```sh
docker compose build release
```

Ensure the following environment variables are set:

- GITHUB_USER
- GITHUB_ACCESS_TOKEN
- RELEASE_BRANCH
- VERSION
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_SESSION_TOKEN
- AWS_REGION
- BUCKET_NAME
- DISTRIBUTION_ID

Then make the release:

```sh
VERSION=patch \
RELEASE_BRANCH=main \
  docker compose run release
```

This process is interactive and will require you to confirm that you want to publish the changed packages. It will also prompt for 2FA.

Browser bundles will be automatically uploaded to the CDN if they have changed.

<small>Note: if a prerelease was made, to graduate it into a normal release you will want to use `patch` as the version.</small>

Finally:

- create a release on GitHub https://github.com/bugsnag/bugsnag-js-performance/releases/new
- use the tag vX.Y.Z as the name of the release
- copy the release notes for this version from `CHANGELOG.md`
- publish the release
- update and push `next`:
  ```sh
  git checkout next
  git merge master
  git push
  ```

### Prereleases

If you are starting a new prerelease, use one of the following values for the `VERSION` variable in the release command:

```
VERSION=[premajor | preminor | prepatch]
```

For subsequent iterations on that release, use:

```
VERSION=prerelease
```

For example:

```sh
VERSION=preminor \
RELEASE_BRANCH=main \
  docker compose run release
```

Prereleases will automatically be published to npm with the dist tag `next`.

The dist tag ensures that prereleases are not installed by unsuspecting users who do not specify a version – npm automatically adds the `latest` tag to a published module unless one is specified.