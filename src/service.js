const { default: axios } = require('axios')
const { extractJiraKey, parseJiraIssueRes } = require('./helper')
const { from, of, forkJoin } = require('rxjs')
const { map, catchError, switchMap } = require('rxjs/operators')
const JiraClient = require('jira-client')

let jiraApi

const init = () => {
  // global vars
  const jiraApiToken = process.env['JIRA_API_TOKEN']
  const jiraApiInfo = process.env['JIRA_BASE_URL'].split(':') // move this utility func into helpe.js

  // initialized jira client api
  const jiraConfig = {
    protocol: jiraApiInfo[0],
    host: jiraApiInfo[1].substring(2),
    username: 'leo.jin@enterprisedb.com',
    password: jiraApiToken,
    apiVersion: 'latest',
    strictSSL: true,
  }
  console.log('jira Config = ', JSON.stringify(jiraConfig, null, 2))
  jiraApi = new JiraClient(jiraConfig)
}

/**
 *
 * @param {object} gitCommit (A git commit object from github context)
 */
const processCommit = (gitCommit) => {
  const { message } = gitCommit
  if (message) {
    const jiraKey = extractJiraKey(message)
    if (jiraKey) {
      // get jira status
      // move the ticket if status is in ToDo
    }
  }
}

const getJiraTicketDevInfo = (ticketId) => {
  const pr$ = from(jiraApi.getDevStatusDetail(ticketId, 'GitHub', 'pullrequest'))
  const commits$ = from(jiraApi.getDevStatusDetail(ticketId, 'GitHub', 'repository'))
  return forkJoin([pr$, commits$]).pipe(
    map(([prs, commits]) => {
      // transform array results into object
      return {
        prs,
        commits,
      }
    }),
    catchError((e) => of(e))
  )
}

const getJiraTicketDetails = (ticketKey) => {
  console.log(`invoking getJiraDetails with ticket id ${ticketKey}`)
  return from(jiraApi.findIssue(ticketKey)).pipe(
    // map((res) => res.data),
    map((data) => parseJiraIssueRes(data)),
    switchMap((result) => {
      const { id, status } = result
      return getJiraTicketDevInfo(id).pipe(
        map((devInfo) => {
          // console.log('devInfo = ', devInfo)
          return { ...result, devInfo }
        })
      )
    }),
    catchError((e) => of(e))
  )
}

init()

module.exports = {
  getJiraTicketDetails,
}
