const { expect } = require('chai')
const helper = require('../src/helper')
const mockJiraRes = require('./mocks/mock-jira-issue-payload.json')

describe(`Test helpers`, function () {
  describe('Test extract jira key from any message', function () {
    let commitMssg

    beforeEach(function () {
      commitMssg = `jira-198 commit new feature jii-008`
    })

    it(`Should only pick up jira-198`, function () {
      const result = helper.extractJiraKey(commitMssg)
      expect(result).to.equal('jira-198')
    })

    it(`Should pick up the first occurance of jira ticket regarless of order`, function () {
      commitMssg = `ommit new feature jira-008`
      const result = helper.extractJiraKey(commitMssg)
      expect(result).to.equal('jira-008')
    })

    it(`Should parse status properly from jira response`, function () {
      const result = helper.parseJiraIssueRes(mockJiraRes.issue)
      expect(result.status.name).to.equal('In Progress')
    })
  })

  describe('Test parse github context and payload for PR events', function () {
    let githubObj = {
      context: {
        eventName: 'pullrequest',
        payload: null,
      },
    }

    before(function () {
      githubObj.context.payload = require('./mocks/mock-pr-readyForRev-payload.json')
    })

    after(function () {
      githubObj = null
    })

    it(`Should parse pull request payload properly`, function () {
      const result = helper.parseGithubEventContext(githubObj)
      expect(result.eventName).to.equal('pullrequest')
      expect(result.payload.action).to.exist
      expect(result.payload.ticketKey).to.equal('tp-6')
    })
  })

  describe('Test parse github context and payload for create branch', function() {
    let githubObj = {
      context: {
        eventName: 'create',
        payload: null,
      },
    }

    before(function () {
      githubObj.context.payload = require('./mocks/mock-create-branch-payload.json')
    })

    after(function () {
      githubObj = null
    })

    it(`Should parse create branch payload properly`, function() {
      const result = helper.parseGithubEventContext(githubObj)
      console.log(result)
      expect(result.eventName).to.equal('create')
      expect(result.payload.ticketKey.toLowerCase()).to.equal('tp-7')
    })
  })

  describe('Test parse github context and payload for create branch', function() {
    let githubObj = {
      context: {
        eventName: 'push',
        payload: null,
      },
    }

    before(function () {
      githubObj.context.payload = require('./mocks/mock-push-commit-payload.json')
    })

    after(function () {
      githubObj = null
    })

    it(`Should parse a push commit payload properly`, function() {
      const result = helper.parseGithubEventContext(githubObj)
      console.log(result)
      expect(result.eventName).to.equal('push')
      expect(result.payload.ticketKey.toLowerCase()).to.equal('tp-6')
    })
  })
})
