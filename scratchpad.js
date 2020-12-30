// testing ground for js, not to be included in prod build
const axios = require('axios')
const jiraUrl = `https://edbtest.atlassian.net`
const jiraApiToken = '0zy6fNhvFPhm0zXFjCxb4685'

const httpConfig = {
  method: 'get',
  url: `${jiraUrl}/rest/api/latest/project`,
  headers: {
    Authorization: `Basic leo.jin@enterprisedb.com:${jiraApiToken}`,
  },
}

// axios(httpConfig)
//   .then((res) => {
//       console.log('res data = ', res.data);
//   })
//   .catch((e) => console.log('error:', e))
axios.get(httpConfig.url, {
    auth: {
        username: 'leo.jin@enterprisedb.com',
        password: jiraApiToken
    }
}).then(res => {
    console.log('res = ', res);
}).catch(e => {
    console.log('error = ', error);
})