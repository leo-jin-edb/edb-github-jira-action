const { default: axios } = require('axios')
const { extractJiraKey, parseJiraIssueRes } = require('./helper')
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

// // this code will get detail commit and pr info from jira
// const getJiraTicketDevInfo = (ticketId) => {
//   const pr$ = from(jiraApi.getDevStatusDetail(ticketId, 'GitHub', 'pullrequest'))
//   const commits$ = from(jiraApi.getDevStatusDetail(ticketId, 'GitHub', 'repository'))
//   return forkJoin([pr$, commits$]).pipe(
//     map(([prs, commits]) => {
//       // transform array results into object
//       return {
//         prs,
//         commits,
//       }
//     }),
//     catchError((e) => of(e))
//   )
// }

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
  console.log(`invoking getJiraDetails with ticket id ${ticketKey}`)
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

/**
 * Handles triggering jira transitions based on a fixed set of logic
 *
 * @param {*} data
 */
const _handleTransition = (data) => {
  const { jiraKey, totalCommits, transitions } = data

  // if (totalCommits === 0) {
  // initial commit, see if has dev start transition available
  const trans = transitions.find((tr) => tr.name === 'Dev Start')
  // trigger transition if it is initial commit against the ticket and
  // it has 'Dev start" available as a valid transition
  if (trans) {
    // execute transition
    console.log(`commits = ${totalCommits} and trans ${trans.name}, we are transitioning the issue`)
    jiraApi.transitionIssue(jiraKey, {
      transition: {
        id: trans.id,
      },
    })
  }
  // }
  return data
}

const getEligibleTransitions = (ticketKey) => {
  return from(jiraApi.listTransitions(ticketKey)).pipe(
    map((data) => {
      return data.transitions
    })
  )
}

/**
 *
 * @param {object} gitCommit (A git commit object from github context)
 */
const processCommit = (gitCommit) => {
  const { message } = gitCommit
  console.log(`commit message = ${message}`)
  if (message) {
    const jiraKey = extractJiraKey(message)
    if (jiraKey) {
      // get jira status
      return _getJiraTicketDetails(jiraKey).pipe(
        map((data) => {
          const { id, status, devInfo } = data
          const { totalPrs, totalCommits } = devInfo
          return {
            jiraId: id,
            jiraKey,
            jiraStatus: {
              id: status.id,
              name: status.name,
            },
            totalCommits,
            totalPrs,
          }
        }),
        switchMap((data) => {
          const { jiraKey } = data
          return getEligibleTransitions(jiraKey).pipe(
            map((transitions) => {
              return { ...data, transitions }
            })
          )
        }),
        map((data) => {
          return _handleTransition(data)
        })
      )
      // move the ticket if status is in ToDo
    }
  }
  return of(null)
}

_init()

module.exports = {
  processCommit,
  _getJiraTicketDetails,
}
