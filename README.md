[![Build Status](https://travis-ci.org/Afigenius/SecretServer-nodejs.svg?branch=master)](https://travis-ci.org/Afigenius/SecretServer-nodejs)
[![GitHub issues](https://img.shields.io/github/issues/Afigenius/SecretServer-nodejs.svg?style=flat)](https://github.com/Afigenius/SecretServer-nodejs/issues)
[![GitHub license](https://img.shields.io/github/license/Afigenius/SecretServer-nodejs.svg?style=flat)](https://github.com/Afigenius/SecretServer-nodejs/blob/master/LICENSE)

    npm i @mr.xcray/thycotic-secretserver-client

# SecretServer-nodejs
JS/NodeJS client for Thycotic Secret Server  

## Thycotic Secret Server  
Website: https://thycotic.com/products/secret-server/  
На русском: https://thycotic.ru/


**On-premise TSS**: v10.3.000015  
**Online version**: supported  
**LDAP Authentication**: supported  
**FREE version**: _not suppored_ (no WebAPI is available)

```JavaScript
    let {TSSClient} = require('@mr.xcray/thycotic-secretserver-client');
      
    let client = new TSSClient(
      "domain/SecretServer", 
      "login", 
      "password"
    );
      
    client.GetSecret(254).then(result => {
      console.log(result);
    });
```

## Implemented
 - **Authenticate** (as part of class constructor logic)
 - **DownloadFileAttachment** - gets filename and contents by ID, used to download attached SSH keys and documents
 - **DownloadFileAttachmentByItemId** - similar to the DownloadFileAttachment web service, but is meant to be used when a Secret has multiple file attachment fields. By setting the third parameter value, the user can choose which file to download.
 - **FolderGet** - gets a specific folder by Id
 - **FolderGetAllChildren** -  returns all child folders for a particular folder
 - **GetSecret** - gets secret by ID with all fields as an associative array (name=>[properties])
 - **GetSecretsByExposedFieldValue** - Searches for Secrets that match a field name / search term but only on Secret Fields marked Exposed for Display on the Secret Template
 - **GetSecretsByFieldValue** - Searches for Secrets that match a field name / search term. This will return all Secrets that contain a field with the specified name and have a value in that field that contains the search term
 - **GetSecretItemHistoryByFieldName** - Use this method to retrieve the history (past values) that were audited for a specific field of a Secret
 - **SearchFolders** - gets list of all folders with keyword in names
 - **SearchSecrets** - gets list of all secrets summaries (shortened secret profiles) with keyword in names
 - **SearchSecretsByExposedFieldValue** - searches for Secrets that match a field name / search term but only on Secret Fields marked Exposed for Display on the Secret Template
 - **SearchSecretsByExposedValues** - Searches for Secrets across fields with a search term but only on Secret Fields marked Exposed for Display on the Secret Template
 - **SearchSecretsByFieldValue** - Searches for Secrets that match a field name / search term
 - **SearchSecretsByFolder** - Web method that searches for Secrets within a folder

## Bonus methods
*sweet extension to official TSS WebAPI*
 - **SearchSecrets_intersect** - secrets with all keywords in names
 - **SearchSecrets_union** - secrets with any of keywords in names
 - **SecretSummaryToSecret** - converts one or array of secrets summaries to one or array of secret profiles with all properties

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
    AuthenticateRADIUS
    ChangePassword
    CheckIn
    CheckInByKey
    CreateDependencyGroupForSecret
    DeactivateSecret
    DeleteSSHCommandMenu
    DenySecretAccessRequest
    ExpireSecret
    FolderCreate
    FolderExtendedCreate
    FolderExtendedGet
    FolderExtendedGetNew
    FolderExtendedUpdate
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
    GetSecretPolicyForSecret
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
    SearchSecretPolicies
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
