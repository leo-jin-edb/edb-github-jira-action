const { default: axios } = require('axios')
const { parseGithubEventContext, parseJiraIssueRes } = require('./helper')
const { from, of, forkJoin } = require('rxjs')
const { map, catchError, switchMap } = require('rxjs/operators')
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

const _getJiraTicketDevSummary = (ticketId) => {
  return from(jiraApi.getDevStatusSummary(ticketId)).pipe(
    map((data) => {
      const { summary } = data
      const { pullrequest, repository } = summary
      return {
        totalPrs: pullrequest.overall.count,
        totalCommits: repository.overall.count,
      }
    })
  )
}

const _getJiraTicketDetails = (ticketKey) => {
  console.log(`invoking getJiraDetails with ticket key '${ticketKey}'`)
  return from(jiraApi.findIssue(ticketKey)).pipe(
    // map((res) => res.data),
    map((data) => parseJiraIssueRes(data)),
    switchMap((result) => {
      const { id, status } = result
      return _getJiraTicketDevSummary(id).pipe(
        map((devInfo) => {
          // console.log('devInfo = ', devInfo)
          return { ...result, devInfo }
        })
      )
    }),
    catchError((e) => of(e))
  )
}

const _getEligibleTransitions = (ticketKey) => {
  return from(jiraApi.listTransitions(ticketKey)).pipe(
    map((data) => {
      return data.transitions
    })
  )
}

/**
 * This private function does the actual call to jira 
 * and transition the ticket.
 * 
 * @param {string} eventName 
 * @param {object} payload 
 */
const _updateTransition = (eventName, payload) => {
  const { ticketKey } = payload
  if (!ticketKey) {
    return of(null)
  }
  const transitionTicket = (ticketKey, transitionId) => {
    return from(
      jiraApi.transitionIssue(ticketKey, {
        transition: {
          id: transitionId,
        },
      })
    )
  }

  const registry = {
    pull_request: () => {
      const { action } = payload
      return _getEligibleTransitions(ticketKey).pipe(
        switchMap((transitions) => {
          let trans
          if (action === 'review_requested') {
            console.log('perform a transition')
            trans = transitions.find((tr) => tr.name === 'Dev On Hold')
          }
          if (action === 'closed') {
            trans = transitions.find((tr) => tr.name === 'Dev Done')
          }
          if (trans) {
            return transitionTicket(ticketKey, trans.id)
          }
          return of(null)
        }),
        catchError((e) => of(e))
      )
    },
    create: () => {
      return _getEligibleTransitions(ticketKey).pipe(
        switchMap((transitions) => {
          // if create branch, we'll look for dev start transition and
          // execute if exists
          const trans = transitions.find((tr) => tr.name === 'Dev Start')
          if (trans) {
            return transitionTicket(ticketKey, trans.id)
          }
          return of(null)
        }),
        catchError((e) => e)
      )
    },
    push: () => {
      return _getEligibleTransitions(ticketKey).pipe(
        switchMap((transitions) => {
          // if create branch, we'll look for dev start transition and
          // execute if exists
          const trans = transitions.find((tr) => tr.name === 'Dev Start')
          if (trans) {
            return transitionTicket(ticketKey, trans.id)
          }
          return of(null)
        }),
        catchError((e) => e)
      )
    },
  }
  return registry[eventName]()
}

const processGithubEvent = (github) => {
  const evt = parseGithubEventContext(github)
  const { eventName, payload } = evt
  return _updateTransition(eventName, payload)
}

_init()

module.exports = {
  processGithubEvent,
}
