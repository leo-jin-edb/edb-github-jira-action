const core = require('@actions/core')
const github = require('@actions/github')
const axios = require('axios')
const helper = require('./helper')
const jiraApiToken = `0zy6fNhvFPhm0zXFjCxb4685`
try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet')
//   const jiraUrl = core.getInput('jira-host')
  const jiraUrl = process.env['JIRA_BASE_URL'];
  const jiraApiToken = process.env['JIRA_API_TOKEN'];
  console.log(`Hello ${nameToGreet}!  Jira host ${jiraUrl}`)
  axios.get(jiraUrl).then((res, err) => {
    console.log('res = ', res)
    if(err) {
        console.log('err = ', err)
    }
  })
  const time = new Date().toTimeString()
  core.setOutput('time', time)
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`)
  const { commits } = github.context.payload
  console.log('commits here = ', commits)
  const commitMssg = commits[0].message
  if (commitMssg) {
    console.log('commit message here = ', commitMssg)
    const jiraTicket = helper.extractJiraKey(commitMssg)
    console.log('extracted jira tickeet = ', jiraTicket)
  }
} catch (error) {
  core.setFailed(error.message)
}
