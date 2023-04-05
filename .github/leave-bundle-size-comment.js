const formatKbs = n => `${(n / 1000).toFixed(2)} kB`
const showDiff = n => {
  if (n > 0) return `\`+${n.toLocaleString()} bytes\` ⚠️`
  if (n < 0) return `\`${n.toLocaleString()} bytes\` 🎉`
  return '_No change_'
}

module.exports = async function (github, context, needs) {
  const npm = {
    before: {
      unminified: needs['base-branch'].outputs['unminified-size'],
      minified: needs['base-branch'].outputs['minified-size'],
      gzipped: needs['base-branch'].outputs['minified-gzip-size'],
    },

    after: {
      unminified: needs['head-branch'].outputs['unminified-size'],
      minified: needs['head-branch'].outputs['minified-size'],
      gzipped: needs['head-branch'].outputs['minified-gzip-size'],
    },
  }

  const diff = {
    npm: {
      unminified: npm.after.unminified - npm.before.unminified,
      minified: npm.after.minified - npm.before.minified,
      gzipped: npm.after.gzipped - npm.before.gzipped,
    },
  }

  const body = `
  ### Browser bundle size

  **NPM build**

  |        | Unminified                              | Minfied                               | Minified + gzipped                   |
  | ------ | --------------------------------------- | ------------------------------------- | ------------------------------------ |
  | Before | \`${formatKbs(npm.before.unminified)}\` | \`${formatKbs(npm.before.minified)}\` | \`${formatKbs(npm.before.gzipped)}\` |
  | After  | \`${formatKbs(npm.after.unminified)}\`  | \`${formatKbs(npm.after.minified)}\`  | \`${formatKbs(npm.after.gzipped)}\`  |
  | ±      | ${showDiff(diff.npm.unminified)}        | ${showDiff(diff.npm.minified)}        | ${showDiff(diff.npm.gzipped)}        |

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
