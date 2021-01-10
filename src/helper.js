function extractJiraKey(commitMssg) {
  const regex = /((?<!([A-Z]{1,10})-?)[A-Z]+-\d+)/im
  const m = commitMssg.match(regex)
  return m ? m[0] : null
}

function parseJiraIssueRes(issueRes) {
  const { fields, id } = issueRes
  console.log('parse jira issue res called fields = ', fields); 
  return {
    id,
    status: fields.status
  }
}

module.exports = {
  extractJiraKey,
  parseJiraIssueRes,
}
