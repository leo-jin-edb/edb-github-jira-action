function extractJiraKey(commitMssg) {
  const regex = /((?<!([A-Z]{1,10})-?)[A-Z]+-\d+)/im
  const m = commitMssg.match(regex)
  return m ? m[0] : null
}

module.exports = {
  extractJiraKey,
}
