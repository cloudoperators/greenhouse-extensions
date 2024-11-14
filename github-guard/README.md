---
title: Github Guard
---

Github Guard Greenhouse Plugin manages Github teams, team memberships and repository & team assignments.

## Hierarchy of Custom Resources

![](img/overview.png)

## Custom Resources

### `Github` – an installation of Github App

```
apiVersion: githubguard.sap/v1
kind: Github
metadata:
  name: com
spec:
  webURL: https://github.com
  v3APIURL: https://api.github.com
  integrationID: 420328
  clientUserAgent: greenhouse-github-guard
  secret: github-com-secret
```

### `GithubOrganization` with Feature & Action Flags
```
apiVersion: githubguard.sap/v1
kind: GithubOrganization
metadata:
  name: com--greenhouse-sandbox
  labels:
    githubguard.sap/addTeam: "true"
    githubguard.sap/removeTeam: "true"
    githubguard.sap/addOrganizationOwner: "true"
    githubguard.sap/removeOrganizationOwner: "true"
    githubguard.sap/addRepositoryTeam: "true"
    githubguard.sap/removeRepositoryTeam: "true"
    githubguard.sap/dryRun: "false"
```

Default team & repository assignments:
![](img/default-team-assignment.png)


### `GithubTeamRepository` for exception team & repository assignments 
![](img/github-team-repository.png)


### `GithubUsername` for external username matching

```
apiVersion: githubguard.sap/v1
kind: GithubUsername
metadata:
  annotations: 
    last-check-timestamp: 1681614602 
   name: com-I313226 
spec:
  userID: greenhouse_onuryilmaz
  githubUsername: onuryilmaz
  github: com
```