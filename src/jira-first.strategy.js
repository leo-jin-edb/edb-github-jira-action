const { default: axios } = require('axios')
const { parseGithubEventContext } = require('./helper')
const JiraClient = require('jira-client')

let jiraApi

const _init = () => {
  // global vars
  const jiraApiToken = process.env['JIRA_API_TOKEN']
  const jiraApiInfo = process.env['JIRA_BASE_URL'].split(':') // move this utility func into helpe.js

  if (!jiraApiToken || !jiraApiInfo) {
    console.log('Cannot locate jira_base_url and jira_api_token variables, please ensure they are added to secrets')
    process.exit(1)
  }
  // initialized jira client api
  const jiraConfig = {
    protocol: jiraApiInfo[0],
    host: jiraApiInfo[1].substring(2),
    username: 'leo.jin@enterprisedb.com',
    password: jiraApiToken,
    apiVersion: 'latest',
    strictSSL: true,
  }
  jiraApi = new JiraClient(jiraConfig)
}

// const _getJiraTicketDevSummary = (ticketId) => {
//   return from(jiraApi.getDevStatusSummary(ticketId)).pipe(
//     map((data) => {
//       const { summary } = data
//       const { pullrequest, repository } = summary
//       return {
//         totalPrs: pullrequest.overall.count,
//         totalCommits: repository.overall.count,
//       }
//     })
//   )
// }

// const _getJiraTicketDetails = (ticketKey) => {
//   console.log(`invoking getJiraDetails with ticket key '${ticketKey}'`)
//   return from(jiraApi.findIssue(ticketKey)).pipe(
//     // map((res) => res.data),
//     map((data) => parseJiraIssueRes(data)),
//     switchMap((result) => {
//       const { id, status } = result
//       return _getJiraTicketDevSummary(id).pipe(
//         map((devInfo) => {
//           // console.log('devInfo = ', devInfo)
//           return { ...result, devInfo }
//         })
//       )
//     }),
//     catchError((e) => of(e))
//   )
// }

const _getEligibleTransitions = async (ticketKey) => {
  const data = await jiraApi.listTransitions(ticketKey)
  // console.log('in get eligible transition= ', data)
  return data.transitions
}

/**
 * This private function does the actual call to jira
 * and transition the ticket.
 *
 * @param {string} eventName
 * @param {object} payload
 */
const _updateTransition = async (eventName, payload) => {
  const { ticketKey } = payload
  console.log(`Processing ticket "${ticketKey}", for event "${eventName}"`)
  if (!ticketKey) {
    throw new Error(`Cannot locate ticket key from PR payload, expected a string got "${ticketKey}"`)
  }
  const transitionTicket = async (ticketKey, transitionId) => {
    return await jiraApi.transitionIssue(ticketKey, {
      transition: {
        id: transitionId,
      },
    })
  }

  const registry = {
    pull_request: async () => {
      try {
        const { action } = payload
        const transitions = await _getEligibleTransitions(ticketKey)
        let trans
        if (action === 'review_requested') {
          trans = transitions.find((tr) => tr.name === 'Dev On Hold')
        }
        if (action === 'closed') {
          trans = transitions.find((tr) => tr.name === 'Dev Done')
        }
        if (trans) {
          return await transitionTicket(ticketKey, trans.id)
        }
      } catch (e) {
        throw e
      }
    },
    create: async () => {
      const transitions = await _getEligibleTransitions(ticketKey)
      const trans = transitions.find((tr) => tr.name === 'Dev Start')
      if (trans) {
        return await transitionTicket(ticketKey, trans.id)
      }
    },
    push: async () => {
      return await registry['create']()
    },
  }
  return registry[eventName]()
}

const processGithubEvent = async (github) => {
  const evt = parseGithubEventContext(github)
  const { eventName, payload } = evt
  return await _updateTransition(eventName, payload)
}

_init()

module.exports = {
  processGithubEvent,
}
