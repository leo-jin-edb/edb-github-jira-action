const { processGithubEvent } = require('../src/service')
describe.only('Test Services', function () {
  let eventData = {
    eventName: 'pullrequest',
    payload: {
      action: 'closed',
      ticketKey: 'TP-7',
    },
  }

  before(function () {})

  after(function () {
    eventData = null
  })

  it(`Test process github event`, function () {
    console.log('works')
    processGithubEvent(eventData)
  })
})
