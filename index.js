const core = require('@actions/core')
const github = require('@actions/github')
const axios = require('axios')
const helper = require('./helper')
// const jiraApiToken = `0zy6fNhvFPhm0zXFjCxb4685`
try {
  // `who-to-greet` input defined in action metadata file
  const jiraUrl = `${process.env['JIRA_BASE_URL']}/rest/api/latest/project`
  const jiraApiToken = process.env['JIRA_API_TOKEN']
  axios.interceptors.request.use(
    (config) => {
      console.log('config = ', config)
      return {
        ...config,
        auth: {
          username: 'leo.jin@enterprisedb.com',
          password: jiraToken,
        },
      }
    },
    (err) => {
      Promise.reject(err)
    }
  )

  axios
    .get(jiraUrl)
    .then((res) => {
      console.log('res = ', res.data)
    })
    .catch((e) => {
      console.log('error = ', error)
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
