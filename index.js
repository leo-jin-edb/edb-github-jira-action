const core = require('@actions/core')
const github = require('@actions/github')
const axios = require('axios');
try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet')
  const jiraUrl = core.getInput('jira-host')
  console.log(`Hello ${nameToGreet}!  Jira host ${jiraUrl}`)
  axios.get(jiraUrl).then((res) => {
      console.log('res = ', res);
  })
  const time = new Date().toTimeString()
  core.setOutput('time', time)
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`)
} catch (error) {
  core.setFailed(error.message)
}
