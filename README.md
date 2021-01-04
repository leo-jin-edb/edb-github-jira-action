# Hello world javascript action

This action prints "Hello World" or "Hello" + the name of a person to greet to the log.

## Inputs

### `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## Outputs

### `time`

The time we greeted you.

## Example usage

uses: actions/edb-github-jira-action@v1
with:
  who-to-greet: 'Leo Jin' 

  JIRA_BASE_URL=https://edbtest.atlassian.net JIRA_API_TOKEN=0zy6fNhvFPhm0zXFjCxb4685 node src/scratchpad.js