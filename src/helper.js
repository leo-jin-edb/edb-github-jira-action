function _parsePRPayload(payload) {
  const { action, pull_request } = payload
  const { title: pr_title, head: sourceBranch } = pull_request
  const { ref: sourceBranchName, label: sourceBranchLabel } = sourceBranch
  let ticketKey = extractJiraKey(pr_title)
  if (!pr_title) {
    // try the branch name
    ticketKey = extractJiraKey(sourceBranchName)
  }
  return {
    action,
    ticketKey
  }
}

function _parseCreatePayload(payload) {
  const { ref: branch_name, ref_type } = payload
  if (ref_type === 'branch') {
    return {
      ticketKey: extractJiraKey(branch_name),
    }
  }
}

function _parsePushCommitPayload(payload) {
  const { commits } = payload
  if (commits && commits.length > 0) {
    return {
      ticketKey: extractJiraKey(commits[0].message),
    }
  }
}

/**
 * Extract jira ticket from a string using regex
 *
 * @param {string} commitMssg
 */
function extractJiraKey(commitMssg) {
  const regex = /((?<!([A-Z]{1,10})-?)[A-Z]+-\d+)/im
  const m = commitMssg.match(regex)
  return m ? m[0].toLowerCase() : null
}

/**
 * Parses response from jira find issue api
 * @param {object} issueRes
 */
function parseJiraIssueRes(issueRes) {
  const { fields, id } = issueRes
  // console.log('parse jira issue res called fields = ', fields);
  return {
    id,
    status: fields.status,
  }
}

function parseGithubEventContext(github) {
  const { eventName, payload } = github.context
  if (eventName === 'pullrequest') {
    return {
      eventName,
      payload: _parsePRPayload(payload),
    }
  }
  if (eventName === 'create') {
    return {
      eventName,
      payload: _parseCreatePayload(payload),
    }
  }
  if (eventName === 'push') {
    return {
      eventName,
      payload: _parsePushCommitPayload(payload),
    }
  }
}

module.exports = {
  extractJiraKey,
  parseJiraIssueRes,
  parseGithubEventContext,
}
