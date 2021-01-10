const core = require('@actions/core')
const github = require('@actions/github')
const service = require('./service')
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

  service.processGithubEvent(github).subscribe((result) => {
    console.log('result = ', result)
  })
} catch (error) {
  core.setFailed(error.message)
}
