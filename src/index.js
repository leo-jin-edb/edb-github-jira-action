const core = require('@actions/core')
const github = require('@actions/github')
const service = require('./service')
const { catchError } = require('rxjs/operators')
const { of } = require('rxjs')
try {
  const time = new Date().toTimeString()
  core.setOutput('time', time)
  core.setOutput('success', true)
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`)
  const { commits } = github.context.payload
  if (commits) {
    const commitPayload = commits[0]
    if (commitPayload) {
      console.log('commit message here = ', commitPayload)
      service
        .processCommit(commitPayload)
        .pipe(catchError((e) => of(e)))
        .subscribe((results) => {
          console.log('results = ', results)
        })
    }
  }
} catch (error) {
  core.setFailed(error.message)
}
