# EDB Github Transition 

This action is intended to automatically transition JIRA tickets based on github events.

## Inputs

### `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## Outputs

### `time`

The time we greeted you.

## Example usage

Put the following in your `.github/workflows/main.yml` file

```
# This is a basic workflow to help you get started with Actions

name: CI

# Controls when the action will run. 
on:
  # Triggers the workflow on push or pull request events but only for the main branch
  push:
    branches: [ main ]
  create:
  pull_request_review:
  pull_request:
    branches: [ main ]
    types: [assigned, opened, closed, ready_for_review, review_requested, reopened]

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

# A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
  # This workflow contains a single job called "build"
  build:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
      # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
      - name: trigger transitions in jira
        id: jira-transition
        uses: leo-jin-edb/edb-github-jira-action@main
        env:
          JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
```
Go to your repository and click on `Settings -> Secrets` and add secrets for `JIRA_BASE_URL` and `JIRA_API_TOKEN`.