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

const _updateTransition = (eventName, payload) => {
  const { ticketKey } = payload
  const registry = {
    pullrequest: (payload) => {
      console.log('handle pull request')
      const { action } = payload
      return _getEligibleTransitions(ticketKey).pipe(
        switchMap((transitions) => {
          console.log('transitions = ', transitions)
          let trans
          if (action === 'review_requested') {
            console.log('perform a transition')
            trans = transitions.find((tr) => tr.name === 'Dev On Hold')
          }
          if (action === 'closed') {
            trans = transitions.find((tr) => tr.name === 'Dev Done')
          }
          if (trans) {
            return from(
              jiraApi.transitionIssue(ticketKey, {
                transition: {
                  id: trans.id,
                },
              })
            )
          }
          return of(null)
        }),
        catchError((e) => of(e))
      )
    },
    create: (payload) => {
      console.log('handle create')
      return _getEligibleTransitions(ticketKey).pipe(
        switchMap((transitions) => {
          console.log('transitions = ', transitions)
          // if create branch, we'll look for dev start transition and
          // execute if exists
          const trans = transitions.find((tr) => tr.name === 'Dev Start')
          console.log('dev start = ', trans)
          if (trans) {
            return from(
              jiraApi.transitionIssue(ticketKey, {
                transition: {
                  id: trans.id,
                },
              })
            )
          }
          return of(null)
        }),
        catchError((e) => e)
      )
    },
    push: (payload) => {
      // TODO: refactor out to another function
      console.log('handle push commit') 
      return _getEligibleTransitions(ticketKey).pipe(
        switchMap((transitions) => {
          console.log('transitions = ', transitions)
          // if create branch, we'll look for dev start transition and
          // execute if exists
          const trans = transitions.find((tr) => tr.name === 'Dev Start')
          console.log('dev start = ', trans)
          if (trans) {
            return from(
              jiraApi.transitionIssue(ticketKey, {
                transition: {
                  id: trans.id,
                },
              })
            )
          } else {
            return of(null)
          }
        }),
        catchError((e) => e)
      )
    },
  }
  return registry[eventName](payload)
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
