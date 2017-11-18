[![Build Status](https://travis-ci.org/Afigenius/SecretServer-nodejs.svg?branch=master)](https://travis-ci.org/Afigenius/SecretServer-nodejs)
[![GitHub issues](https://img.shields.io/github/issues/Afigenius/SecretServer-nodejs.svg?style=flat)](https://github.com/Afigenius/SecretServer-nodejs/issues)
[![GitHub license](https://img.shields.io/github/license/Afigenius/SecretServer-nodejs.svg?style=flat)](https://github.com/Afigenius/SecretServer-nodejs/blob/master/LICENSE)

    npm i @mr.xcray/thycotic-secretserver-client

# SecretServer-nodejs
JS/NodeJS client for Thycotic Secret Server

**TSS Version**: 10.3.000015

```JavaScript
    let {TSSClient} = require('@mr.xcray/thycotic-secretserver-client');
      
    let client = new TSSClient(
      "domain/SecretServer", 
      "login", 
      "password"
    );
      
    client.GetSecretById(254).then(result => {
      console.log(result);
    });
```

## Implemented
    DownloadFileAttachmentByItemId
    GetSecret

## Will be implemented
    AddDependency
    AddGroupToActiveDirectorySynchronization
    AddNewSecret
    AddScript
    AddSecret
    AddSecretCustomAudit
    AddSecretPolicy
    AddUser
    ApproveSecretAccessRequest
    AssignSecretPolicyForSecret
    AssignSite
    AssignUserToGroup
    Authenticate
    AuthenticateRADIUS
    ChangePassword
    CheckIn
    CheckInByKey
    CreateDependencyGroupForSecret
    DeactivateSecret
    DeleteSSHCommandMenu
    DenySecretAccessRequest
    DownloadFileAttachment
    ExpireSecret
    FolderCreate
    FolderExtendedCreate
    FolderExtendedGet
    FolderExtendedGetNew
    FolderExtendedUpdate
    FolderGet
    FolderGetAllChildren
    FolderUpdate
    GeneratePassword
    GetAllGroups
    GetAllScripts
    GetAllSSHCommandMenus
    GetCheckOutStatus
    GetDependencies
    GetDependencyGroupsForSecret
    GetDistributedEngines
    GetFavorites
    GetNewSecret
    GetNewSecretPolicy
    GetReport
    GetScript
    GetSecretAudit
    GetSecretItemHistoryByFieldName
    GetSecretPolicyForSecret
    GetSecretsByExposedFieldValue
    GetSecretsByFieldValue
    GetSecretTemplateFields
    GetSecretTemplates
    GetSSHCommandMenu
    GetSSHLoginCredentials
    GetSSHLoginCredentialsWithMachine
    GetTicketSystems
    GetTokenIsValid
    GetUser
    ImpersonateUser
    ImportXML
    RemoveDependency
    RemoveDependencyGroupForSecret
    RestoreSSHCommandMenu
    RunActiveDirectorySynchronization
    SaveSSHCommandMenu
    SearchFolders
    SearchSecretPolicies
    SearchSecrets
    SearchSecretsByExposedFieldValue
    SearchSecretsByExposedValues
    SearchSecretsByFieldValue
    SearchSecretsByFolder
    SearchUsers
    SetCheckOutEnabled
    UpdateDependencyGroupForSecret
    UpdateIsFavorite
    UpdateScript
    UpdateSecret
    UpdateSecretPermission
    UpdateUser
    UploadFileAttachment
    UploadFileAttachmentByItemId
    VersionGet
    WhoAmI
