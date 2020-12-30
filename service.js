const { default: axios } = require('axios')
const { extractJiraKey } = require('./helper')

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
      const jiraKey = extractJiraKey(message);
      if(jiraKey) {
          // get jira status
          // move the ticket if status is in ToDo
      }
  }
}

const getJiraTicketDetails = (ticketId) => {
  console.log(`involking getJiraDetails with ticket id ${ticketId}`)
  return axios.get(`${jiraUrl}/issue/${ticketId}`)
}

module.exports = {
  getJiraTicketDetails,
}
