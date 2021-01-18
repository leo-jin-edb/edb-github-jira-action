const { parseGithubEventContext } = require('./helper')
const { Octokit } = require('@octokit/rest')

let octokit
let accessToken
let owner
let repo
let jiraBaseUrl

const _init = () => {
  accessToken = process.env['GITHUB_ACCESSTOKEN']
  jiraBaseUrl = process.env['JIRA_BASE_URL']
  octokit = new Octokit({
    auth: accessToken,
  })
}

const _getColumnWithName = async (columnName = 'To do') => {
  try {
    const projectsRes = await octokit.projects.listForRepo({
      owner,
      repo,
    })
    const projects = projectsRes.data
    if (!projects || projects.length === 0) {
      throw `no projects found for repo "${repo}"`
    }
    const columnsRes = await octokit.projects.listColumns({
      project_id: projects[0].id,
    })
    const column = columnsRes.data.find((col) => col.name === columnName)
    return column
  } catch (e) {
    throw e
  }
}

const _addIssue = async (issueData, column) => {
  try {
    const bodyTemplate = `${issueData.summary}
    jira link: [visit](${jiraBaseUrl}/browse/${issueData.key})
    parent jira link: [visit](${jiraBaseUrl}/browse/${issueData.parent.key})`

    const addIssueRes = await octokit.issues.create({
      owner,
      repo,
      title: issueData.summary,
      body: bodyTemplate,
    })
    const addToProjectRes = await octokit.projects.createCard({
      column_id: column.id,
      content_id: addIssueRes.data.id,
      content_type: 'Issue',
    })
    return {
      issue: addIssueRes.data,
      card: addToProjectRes.data,
    }
  } catch (e) {
    throw e
  }
}

const _handleRepositoryEvent = async (eventName, payload) => {
  const { client_payload } = payload
  const column = await _getColumnWithName()
  const result = await _addIssue(client_payload, column)
  console.log('column = ', result)
  return result
}

const processGithubEvent = async (github) => {
  const evt = parseGithubEventContext(github)
  const { eventName, payload } = evt
  const { repository } = payload
  if (!payload.client_payload) {
    console.log('jira-github strategy found no client payload, we skip')
    return null
  }
  repo = repository.name
  owner = repository.owner.login
  console.log(`processing github event for repository "${repo}" and owner "${owner}"`)
  return await _handleRepositoryEvent(eventName, payload)
}

_init()

module.exports = {
  processGithubEvent,
}
