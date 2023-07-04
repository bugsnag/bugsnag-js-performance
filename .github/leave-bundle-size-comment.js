const formatKbs = n => `${(n / 1000).toFixed(2)} kB`
const showDiff = n => {
  if (n > 0) return `\`+${n.toLocaleString()} bytes\` ⚠️`
  if (n < 0) return `\`${n.toLocaleString()} bytes\` 🎉`
  return '_No change_'
}

module.exports = async function (github, context, coverageDiff, needs) {
  const sizes = {
    before: {
      package: needs['base-branch'].outputs['package-size'],
      unminified: needs['base-branch'].outputs['unminified-size'],
      minified: needs['base-branch'].outputs['minified-size'],
      gzipped: needs['base-branch'].outputs['minified-gzip-size'],
      coverage: needs['base-branch'].outputs['code-coverage'],
    },

    after: {
      package: needs['head-branch'].outputs['package-size'],
      unminified: needs['head-branch'].outputs['unminified-size'],
      minified: needs['head-branch'].outputs['minified-size'],
      gzipped: needs['head-branch'].outputs['minified-gzip-size'],
      coverage: needs['head-branch'].outputs['code-coverage'],
    },
  }

  const diff = {
    package: sizes.after.package - sizes.before.package,
    unminified: sizes.after.unminified - sizes.before.unminified,
    minified: sizes.after.minified - sizes.before.minified,
    gzipped: sizes.after.gzipped - sizes.before.gzipped,
  }

  const body = `
  ### Browser bundle size

  **NPM build**

  |        | Package                                |
  | ------ | -------------------------------------- |
  | Before | \`${formatKbs(sizes.before.package)}\` |
  | After  | \`${formatKbs(sizes.after.package)}\`  |
  | ±      | ${showDiff(diff.package)}              |

  **CDN build**

  |        | Unminified                                | Minfied                                 | Minified + gzipped                     |
  | ------ | ----------------------------------------- | --------------------------------------- | -------------------------------------- |
  | Before | \`${formatKbs(sizes.before.unminified)}\` | \`${formatKbs(sizes.before.minified)}\` | \`${formatKbs(sizes.before.gzipped)}\` |
  | After  | \`${formatKbs(sizes.after.unminified)}\`  | \`${formatKbs(sizes.after.minified)}\`  | \`${formatKbs(sizes.after.gzipped)}\`  |
  | ±      | ${showDiff(diff.unminified)}              | ${showDiff(diff.minified)}              | ${showDiff(diff.gzipped)}              |

  ### Code coverage

  ${coverageDiff.diff(sizes.before.coverage, sizes.after.coverage).results}

  <p align="right">
    Generated against ${context.payload.pull_request.head.sha}
    on ${new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'long' })}
  </p>
  `.trim()

  const issue_number = context.issue.number
  const owner = context.repo.owner
  const repo = context.repo.repo

  const comments = await github.rest.issues.listComments({ issue_number, owner, repo })

  const existingComment = comments.data.find(function (comment) {
    return comment.body.startsWith('### Browser bundle size')
      && comment.user.login === 'github-actions[bot]'
  })

  if (existingComment) {
    console.log('Updating existing comment')
    console.log(existingComment.html_url)

    await github.rest.issues.updateComment({ comment_id: existingComment.id, issue_number, owner, repo, body })
  } else {
    console.log('Creating new comment')

    const newComment = await github.rest.issues.createComment({ issue_number, owner, repo, body })

    console.log(newComment.html_url)
  }
}
