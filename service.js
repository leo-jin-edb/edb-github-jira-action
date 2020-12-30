const { default: axios } = require("axios")

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

const getJiraTicketDetails = (ticketId) => {
  console.log(`involking getJiraDetails with ticket id ${ticketId}`)
  return axios.get(`${jiraUrl}/issue/${ticketId}`);
}

module.exports = {
    getJiraTicketDetails
}
