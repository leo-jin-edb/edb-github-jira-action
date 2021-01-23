const core = require('@actions/core')
const github = require('@actions/github')
const jiraFirstStrategy = require('./jira-first.strategy')
const jiraGithubStrategy = require('./jira-github.strategy')
try {
  const time = new Date().toTimeString()
  core.setOutput('time', time)
  core.setOutput('success', true)
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  // console.log(`The context = ${JSON.stringify(github.context, null, 2)}`)
  const eventName = github.context.eventName
  console.log('Event name here = ', eventName)
  console.log(`The event payload: ${payload}`)
  const strategyName = core.getInput('strategy') || 'bidirectional'
  console.log(`Executing strategy "${strategyName}"`)
  let strategy

  if (strategyName === 'bidirectional') {
    strategy = jiraGithubStrategy
  } else {
    strategy = jiraFirstStrategy
  }
  strategy
    .processGithubEvent(github)
    .then((data) => {
      console.log(`Successfully processed github event data = `, data)
    })
    .catch((e) => {
      throw e
    })
} catch (error) {
  core.setFailed(error.message)
}
