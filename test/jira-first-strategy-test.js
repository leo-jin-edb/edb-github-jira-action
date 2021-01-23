const { processGithubEvent } = require('../src/jira-first.strategy')
const { createSandbox } = require('sinon')
const JiraClient = require('jira-client')
const chai = require('chai')
const expect = chai.expect
chai.use(require('chai-as-promised'))

describe.only('Test Services', function () {
  let sandbox
  let github

  beforeEach(function () {
    sandbox = createSandbox()
    sandbox.stub(JiraClient.prototype, 'listTransitions').returns(
      Promise.resolve({
        transitions: [
          {
            id: '1',
            name: 'Dev On Hold',
          },
          {
            id: '2',
            name: 'Dev Done',
          },
          {
            id: '3',
            name: 'Dev Start',
          },
        ],
      })
    )
    sandbox.stub(JiraClient.prototype, 'transitionIssue')

    github = {
      context: {
        eventName: '',
        payload: {
          action: '',
          pull_request: {
            title: '',
            head: {
              label: '',
              ref: '',
            },
          },
        },
      },
    }
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe(`Test handling 'pull_request' event`, function () {
    beforeEach(function () {
      github.context.eventName = 'pull_request'
      github.context.payload.pull_request.title = 'title tp-6'
    })

    it(`Should trigger transition if action is "review_requested"`, async function () {
      github.context.payload.action = 'review_requested'
      await processGithubEvent(github)
      expect(JiraClient.prototype.transitionIssue.calledOnce).to.be.true
    })

    it(`Should trigger transition if action is "closed"`, async function () {
      github.context.payload.action = 'closed'
      await processGithubEvent(github)
      expect(JiraClient.prototype.transitionIssue.calledOnce).to.be.true
    })

    it(`Should NOT tigger transition if action is unsupported`, async function () {
      github.context.payload.action = 'someaction'
      await processGithubEvent(github)
      expect(JiraClient.prototype.transitionIssue.calledOnce).to.be.false
    })

    it(`Should fail gracefully if no jira ticket is found in pr 'Title' or 'head.ref'`, async function () {
      github.context.payload.action = 'review_requested'
      github.context.payload.pull_request.title = 'random title'
      // head.ref provides the branch name
      github.context.payload.pull_request.head.ref = 'feat/no-jira'
      await expect(processGithubEvent(github)).to.be.rejectedWith(Error)
    })
  })

  describe(`Test handling 'create' branch event`, function () {
    beforeEach(function () {
      github.context.eventName = 'create'
      github.context.payload.ref = 'feature/TP-7'
      github.context.payload.ref_type = 'branch'
    })

    it(`Should handle 'create' branch event`, async function () {
      await processGithubEvent(github)
      expect(JiraClient.prototype.transitionIssue.calledOnce).to.be.true
    })

    it(`Should fail gracefully if no jira ticket is found in branch name'`, async function () {
      // head.ref provides the branch name
      github.context.payload.ref = 'feat/no-jira'
      await expect(processGithubEvent(github)).to.be.rejectedWith(Error)
    })
  })

  describe(`Test handling 'push'event`, function () {
    beforeEach(function () {
      github.context.eventName = 'push'
      github.context.payload.commits = [
        {
          message: 'TP-6',
        },
      ]
    })

    it(`Should handle 'create' branch event`, async function () {
      await processGithubEvent(github)
      expect(JiraClient.prototype.transitionIssue.calledOnce).to.be.true
    })

    it(`Should fail gracefully if no jira ticket in commit message'`, async function () {
      github.context.payload.commits[0].message = 'normal message'
      await expect(processGithubEvent(github)).to.be.rejectedWith(Error)
    })
  })
})
