const jiraGithubService = require('../src/jira-github.strategy')
const sinon = require('sinon')
const { Octokit } = require('@octokit/rest')


describe(`Test jira -> github bidrectional integration`, function () {
  let githubObj = {
    context: {
      eventName: 'repository_dispatch',
      payload: require('./mocks/mock-jira-invoked-repo-event.json'),
    },
  }

  before(function () {})

  it(`Should parse repsitory events properly`, function (done) {
    console.log('github obj = ', githubObj)
   /* jiraGithubService
      .processGithubEvent(githubObj)
      .then((data) => {
        console.log('data')
        done()
      })
      .catch((e) => { 
        console.log('error = ', e)
        done()
      }) */
      done()
  })
})
