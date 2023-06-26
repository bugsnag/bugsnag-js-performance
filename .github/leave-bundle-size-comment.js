const formatKbs = n => `${(n / 1000).toFixed(2)} kB`
const showDiff = n => {
  if (n > 0) return `\`+${n.toLocaleString()} bytes\` ⚠️`
  if (n < 0) return `\`${n.toLocaleString()} bytes\` 🎉`
  return '_No change_'
}

module.exports = async function (github, context, needs) {
  const npm = {
    before: {
      package: needs['base-branch'].outputs['package-size'],
    },

    after: {
      package: needs['head-branch'].outputs['package-size'],
    },
  }

  const diff = {
    npm: {
      package: npm.after.package - npm.before.package,
    },
  }

  const body = `
  ### Browser bundle size

  **NPM build**

  |        | Package                                 |
  | ------ | --------------------------------------- |
  | Before | \`${formatKbs(npm.before.package)}\`    |
  | After  | \`${formatKbs(npm.after.package)}\`     |
  | ±      | ${showDiff(diff.npm.package)}           |

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
