const { expect } = require('chai')
const helper = require('./helper')

describe(`Test helpers`, function () {
  let commitMssg

  beforeEach(function () {
    commitMssg = `jira-198 commit new feature jii-008`
  })

  it(`Should only pick up jira-198`, function () {
    const result = helper.extractJiraKey(commitMssg)
    expect(result).to.equal('jira-198')
  })

  it(`Should pick up the first occurance of jira ticket regarless of order`, function () {
    commitMssg = `ommit new feature jii-008`
    const result = helper.extractJiraKey(commitMssg)
    expect(result).to.equal('jii-008')
  })
})
