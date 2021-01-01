const { default: axios } = require('axios')
const { extractJiraKey, parseJiraIssueRes } = require('./helper')
const { from, of } = require('rxjs')
const { map, catchError, switchMap } = require('rxjs/operators')

// global vars
const jiraUrl = `${process.env['JIRA_BASE_URL']}/rest/api/latest`
const jiraApiToken = process.env['JIRA_API_TOKEN']

// setup auth interceptor
axios.interceptors.request.use(
  (config) => {
    return {
      ...config,
      auth: {
        username: 'leo.jin@enterprisedb.com',
        password: jiraApiToken,
      },
    }
  },
  (err) => {
    Promise.reject(err)
  }
)

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
  const url = `${process.env['JIRA_BASE_URL']}/rest/dev-status/latest/issue/detail?issueId=${ticketId}&applicationType=GitHub&dataType=repository`
  return from(axios.get(url)).pipe(
    map((res) => res.data),
    catchError((e) => of(e))
  )
}

const getJiraTicketDetails = (ticketKey) => {
  console.log(`involking getJiraDetails with ticket id ${ticketKey}`)
  return from(axios.get(`${jiraUrl}/issue/${ticketKey}`)).pipe(
    map((res) => res.data),
    map((data) => parseJiraIssueRes(data)),
    switchMap((result) => {
      const { id, status } = result;
      return getJiraTicketDevInfo(id).pipe(
        map(devInfo => {
          console.log('devInfo = ', devInfo);
          return result;
        })
      )

    }),
    catchError((e) => of(e))
  )
}

module.exports = {
  getJiraTicketDetails,
}
