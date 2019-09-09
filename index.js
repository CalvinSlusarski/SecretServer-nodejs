require('./types');
const array = require('ensure-array');
const soap = require('soap');
const {URL} = require('url');
const ping = require('ping');
const isDomain = require('is-valid-domain');
const isIP = require('is-ip');

/**
 * Starts connection negotiation. May result in async exception in case of connection error.
 * Connection procedure is async, all methods will wait for it to end before sending requests.
 *
 * @param {string} url
 * @param {string} login - The username for authentication
 * @param {string} password - The password for authentication
 * @param {string} [organization=null] - The organization code if using Secret Server Online. For installed Secret Server, you must specify null or an
 empty string or authentication will fail
 * @param {string} [domain=null] - The domain if attempting to authenticate using a domain account. For non-domain accounts, passing null,
 empty string, or “(local)” indicates it is not a domain account.
 * @constructor
 */
function ThycoticSecretServerClient (url, login, password, organization, domain, overrideurl){
  "use strict";
  //TODO: add organization and domain params to comply with Authenticate method

  this.ERRORS={
    GOT_EMPTY_TOKEN: "Authentication resulted in empty token. That is unexpected.",
    GOT_EMPTY_SECRET: "Got empty secret with no error. That is unexpected.",
    BAD_TSS_URL: "It seems that TSS URL provided is incorrect",
    ARRAY_OR_ONE_EXPECTED: "Argument expected to be an array or object."
  };

  this.connection = this._connect(url, login, password, organization, domain);
}

/**
 * Starts connection sequence with error handling.
 *
 * @param {string} url
 * @param {string} login - The username for authentication
 * @param {string} password - The password for authentication
 * @param {string} [organization=null] - The organization code if using Secret Server Online. For installed Secret Server, you must specify null or an
 empty string or authentication will fail
 * @param {string} [domain=null] - The domain if attempting to authenticate using a domain account. For non-domain accounts, passing null,
 empty string, or “(local)” indicates it is not a domain account.
 * @returns {Promise.<[soap, ThycoticSecretServerClient, string]>}
 * @private
 */
ThycoticSecretServerClient.prototype._connect = async function (url, login, password, organization, domain, overrideurl){
  "use strict";
  if(overrideurl !== true) {
    url = await this.fixURL(url);
  }

  let client=null;
  try {
    client = await soap.createClientAsync(url, {endpoint: url});
  }catch(e){
    this._exception('BAD_TSS_URL');
  }
  let oThis = this;

  if (domain===undefined){
    domain=null;
  }
  if (organization===undefined){
    organization=null;
  }

  return await client.AuthenticateAsync({
    username: login,
    password: password,
    organization: organization,
    domain: domain
  }).then(async answer=>{
    if (!oThis.isError(answer)){
      return {client:client, context:oThis, token:answer.AuthenticateResult.Token};
    }
  }).catch(error=>{
    oThis._exception(error);
  });

};

/**
 * method is used to get all of the favorites Secrets for the current user
 *
 * @param {boolean} [includeRestricted=false]
 * @return {Promise.<SecretSummary[]>}
 */
ThycoticSecretServerClient.prototype.GetFavorites = async function(includeRestricted){
  "use strict";
  return this.connection.then((connection)=>{
    let {client, context, token}=connection;
    return client.GetFavoritesAsync({
      token:token,
      includeRestricted: includeRestricted===true
    }).then(async answer=>{
      if (!context.isError(answer)){
        if (
          answer.GetFavoritesResult.SecretSummaries!==null
          && answer.GetFavoritesResult.SecretSummaries.hasOwnProperty('SecretSummary')
        ) {
          return answer.GetFavoritesResult.SecretSummaries.SecretSummary;
        }else{
          return [];
        }
      }
    })
  })
};

/**
 * Use this method to retrieve the history (past values) that were audited for a specific field of a Secret
 *
 * @param {number} secretId
 * @param {string} fieldDisplayName
 * @return {Promise.<SecretItemHistoryWebServiceResult[]>}
 * @constructor
 */
ThycoticSecretServerClient.prototype.GetSecretItemHistoryByFieldName = async function(secretId, fieldDisplayName){
  "use strict";
  return this.connection.then((connection)=>{
    let {client, context, token}=connection;
    return client.GetSecretItemHistoryByFieldNameAsync({
      token:token,
      secretId:secretId,
      fieldDisplayName: fieldDisplayName
    }).then(async answer=>{
      if (
        !context.isError(answer)
        && answer.GetSecretItemHistoryByFieldNameResult.Success===true
      ){
        if (
          answer.GetSecretItemHistoryByFieldNameResult.SecretItemHistories!==null
          && answer.GetSecretItemHistoryByFieldNameResult.SecretItemHistories.hasOwnProperty('SecretItemHistoryWebServiceResult')
          && answer.GetSecretItemHistoryByFieldNameResult.SecretItemHistories.SecretItemHistoryWebServiceResult!==null
        ){
          return answer.GetSecretItemHistoryByFieldNameResult.SecretItemHistories.SecretItemHistoryWebServiceResult
        }else{
          return [];
        }
      }
    })
  })
};

/**
 * A web method that downloads a file attachment stored on a Secret
 *
 * @param {number} secretId
 * @returns {Promise.<DownloadFileAttachmentByItemIdResult>} file object
 */
ThycoticSecretServerClient.prototype.DownloadFileAttachment = async function(secretId){
  "use strict";
  return this.connection.then((connection)=>{
    let {client, context, token}=connection;
    return client.DownloadFileAttachmentAsync({
      token:token,
      secretId:secretId,
    }).then(async answer=>{
      if (!context.isError(answer)){
        return answer.DownloadFileAttachmentResult;
      }
    })
  })
};

/**
 * This is similar to the DownloadFileAttachment web service, but is meant to be used when a Secret has multiple file
 * attachment fields. By setting the third parameter value, the user can choose which file to download.
 *
 * @param {number} secretId
 * @param {number} secretItemId
 * @returns {Promise.<DownloadFileAttachmentByItemIdResult>} file object
 */
ThycoticSecretServerClient.prototype.DownloadFileAttachmentByItemId = async function(secretId, secretItemId){
  "use strict";
  return this.connection.then((connection)=>{
    let {client, context, token}=connection;
    return client.DownloadFileAttachmentByItemIdAsync({
      token:token,
      secretId:secretId,
      secretItemId:secretItemId
    }).then(async answer=>{
      if (!context.isError(answer)){
        return answer.DownloadFileAttachmentByItemIdResult;
      }
    })
  })
};

/**
 * Gets secret with all fields and files attached.
 *
 * @param {number} secretId - secret ID
 * @returns {Promise.<Secret>}
 */
ThycoticSecretServerClient.prototype.GetSecret = async function(secretId){
  "use strict";
  return this.connection.then((connection)=>{
    let {client, context, token}=connection;
    return client.GetSecretAsync({
      token:token,
      secretId:secretId,
      loadSettingsAndPermissions:true,

      //TODO: add possibility to get a secret that requires comment
      //https://thycotic.force.com/support/s/article/Using-GetSecret-to-Get-a-Secret-that-Requires-Comment-API-Example-Ruby
      //codeResponses: ...

    }).then(async answer=>{
      if (!context.isError(answer)){
        let secret = answer.GetSecretResult.Secret;
        await context.fixItems(secret);
        return secret;
      }
    });
  })
};

/**
 * Searches for Secrets that match a field name / search term. This will return all Secrets that have a field that is an
 * exact match of the fieldName value and that field has a value that is an exact match of the fieldSearchTerm
 * parameter.
 *
 * @param {string} fieldName
 * @param {string} searchTerm
 * @param {boolean} showDeleted
 * @param {boolean} showRestricted
 * @return {Promise.<SecretSummary[]>}
 */
ThycoticSecretServerClient.prototype.SearchSecretsByFieldValue = async function(fieldName, searchTerm, showDeleted, showRestricted){
  "use strict";
  searchTerm = (""+searchTerm).trim();
  return this.connection.then(connection=>{
    let {client, context, token}=connection;
    return client.SearchSecretsByFieldValueAsync({
      token:token,
      searchTerm:searchTerm,
      fieldName: fieldName,
      showDeleted: showDeleted===true,
      showRestricted: showRestricted===true
    }).then(async answer=>{
      if (!context.isError(answer)){
        if (
          answer.SearchSecretsByFieldValueResult.SecretSummaries!==null
          && answer.SearchSecretsByFieldValueResult.SecretSummaries.hasOwnProperty('SecretSummary')
        ) {
          return answer.SearchSecretsByFieldValueResult.SecretSummaries.SecretSummary;
        }else{
          return [];
        }
      }
    });
  })
};

/**
 * Searches for Secrets that match a field name / search term. This will return all Secrets that contain a field with
 * the specified name and have a value in that field that contains the search term.
 *
 * @param {string} fieldName
 * @param {string} searchTerm
 * @param {boolean} showDeleted
 * @return {Promise.<Secret[]>}
 */
ThycoticSecretServerClient.prototype.GetSecretsByFieldValue = async function(fieldName, searchTerm, showDeleted){
  "use strict";
  searchTerm = (""+searchTerm).trim();
  return this.connection.then(connection=>{
    let {client, context, token}=connection;
    return client.GetSecretsByFieldValueAsync({
      token:token,
      searchTerm:searchTerm,
      fieldName: fieldName,
      showDeleted: showDeleted===true,
    }).then(async answer=>{
      if (!context.isError(answer)){
        if (
          answer.GetSecretsByFieldValueResult.Secrets!==null
          && answer.GetSecretsByFieldValueResult.Secrets.hasOwnProperty('Secret')
        ) {
          let secrets=[];
          for(let secret of answer.GetSecretsByFieldValueResult.Secrets.Secret){
            await context.fixItems(secret);
            secrets.push(secret);
          }
          return secrets;
        }else{
          return [];
        }
      }
    });
  })
};

/**
 * Searches for Secrets that match a field name / search term but only on Secret Fields marked Exposed for Display
 * on the Secret Template. This will return all Secrets that contain a field with the specified name and have a value
 * in that field that contains the search term.
 *
 * @param {string} fieldName
 * @param {string} searchTerm
 * @param {boolean} showPartialMatches
 * @param {boolean} showDeleted
 * @param {boolean} showRestricted
 * @return {Promise.<SecretSummary[]>}
 */
ThycoticSecretServerClient.prototype.SearchSecretsByExposedFieldValue = async function(fieldName, searchTerm, showPartialMatches, showDeleted, showRestricted){
  "use strict";
  searchTerm = (""+searchTerm).trim();
  return this.connection.then(connection=>{
    let {client, context, token}=connection;
    return client.SearchSecretsByExposedFieldValueAsync({
      token:token,
      searchTerm:searchTerm,
      fieldName: fieldName,
      showPartialMatches: showPartialMatches===true,
      showDeleted: showDeleted===true,
      showRestricted: showRestricted===true
    }).then(async answer=>{
      if (!context.isError(answer)){
        if (
          answer.SearchSecretsByExposedFieldValueResult.SecretSummaries!==null
          && answer.SearchSecretsByExposedFieldValueResult.SecretSummaries.hasOwnProperty('SecretSummary')
        ) {
          return answer.SearchSecretsByExposedFieldValueResult.SecretSummaries.SecretSummary;
        }else{
          return [];
        }
      }
    });
  })
};

/**
 * Searches for Secrets that match a field name / search term but only on Secret Fields marked Exposed for Display
 * on the Secret Template. This will return all Secrets that contain a field with the specified name and have a value
 * in that field that contains the search term.
 *
 * @param {string} fieldName
 * @param {string} searchTerm
 * @param {boolean} showPartialMatches
 * @param {boolean} showDeleted
 * @return {Promise.<Secret[]>}
 */
ThycoticSecretServerClient.prototype.GetSecretsByExposedFieldValue = async function(fieldName, searchTerm, showPartialMatches, showDeleted){
  "use strict";
  searchTerm = (""+searchTerm).trim();
  return this.connection.then(connection=>{
    let {client, context, token}=connection;
    return client.GetSecretsByExposedFieldValueAsync({
      token:token,
      searchTerm:searchTerm,
      fieldName: fieldName,
      showPartialMatches: showPartialMatches===true,
      showDeleted: showDeleted===true,
    }).then(async answer=>{
      if (!context.isError(answer)) {
        if (
          answer.GetSecretsByExposedFieldValueResult.Secrets !== null
          && answer.GetSecretsByExposedFieldValueResult.Secrets.hasOwnProperty('Secret')
        ) {
          let secrets = [];
          for (let secret of answer.GetSecretsByExposedFieldValueResult.Secrets.Secret) {
            await context.fixItems(secret);
            secrets.push(secret);
          }
          return secrets;
        } else {
          return [];
        }
      }
    });
  })
};

/**
 * Searches for Secrets across fields with a search term but only on Secret Fields marked Exposed for Display on
 * the Secret Template. This will return all Secrets that have a value in that field that contains the search term.
 *
 * @param {string} searchTerm
 * @param {boolean} showPartialMatches
 * @param {boolean} showDeleted
 * @param {boolean} showRestricted
 * @return {Promise.<SecretSummary[]>}
 */
ThycoticSecretServerClient.prototype.SearchSecretsByExposedValues = async function(searchTerm, showPartialMatches, showDeleted, showRestricted){
  "use strict";
  searchTerm = (""+searchTerm).trim();
  return this.connection.then(connection=>{
    let {client, context, token}=connection;
    return client.SearchSecretsByExposedValuesAsync({
      token:token,
      searchTerm:searchTerm,
      showPartialMatches: showPartialMatches===true,
      showDeleted: showDeleted===true,
      showRestricted: showRestricted===true
    }).then(async answer=>{
      if (!context.isError(answer)){
        if (
          answer.SearchSecretsByExposedValuesResult.SecretSummaries!==null
          && answer.SearchSecretsByExposedValuesResult.SecretSummaries.hasOwnProperty('SecretSummary')
        ) {
          return answer.SearchSecretsByExposedValuesResult.SecretSummaries.SecretSummary;
        }else{
          return [];
        }
      }
    });
  })
};

/**
 * Searches for Secrets within a folder.
 *
 * @param {string} searchTerm
 * @param {number} folderId
 * @param {boolean} includeSubFolders
 * @param {boolean} showDeleted
 * @param {boolean} showRestricted
 * @return {Promise.<SecretSummary[]>}
 */
ThycoticSecretServerClient.prototype.SearchSecretsByFolder = async function(searchTerm, folderId, includeSubFolders, showDeleted, showRestricted){
  "use strict";
  searchTerm = (""+searchTerm).trim();
  return this.connection.then(connection=>{
    let {client, context, token}=connection;
    return client.SearchSecretsByFolderAsync({
      token:token,
      searchTerm:searchTerm,
      folderId: folderId,
      includeSubFolders: includeSubFolders===true,
      showDeleted: showDeleted===true,
      showRestricted: showRestricted===true
    }).then(async answer=>{
      if (!context.isError(answer)){
        if (
          answer.SearchSecretsByFolderResult.SecretSummaries!==null
          && answer.SearchSecretsByFolderResult.SecretSummaries.hasOwnProperty('SecretSummary')
        ) {
          return answer.SearchSecretsByFolderResult.SecretSummaries.SecretSummary;
        }else{
          return [];
        }
      }
    });
  })
};

/**
 * Searches secrets containing searchTerm in the name
 *
 * @param {string} searchTerm
 * @param {boolean} includeDeleted
 * @param {boolean} includeRestricted
 * @return {Promise.<SecretSummary[]>}
 */
ThycoticSecretServerClient.prototype.SearchSecrets = async function(searchTerm, includeDeleted, includeRestricted){
  "use strict";
  searchTerm = (""+searchTerm).trim();
  return this.connection.then(connection=>{
    let {client, context, token}=connection;
    return client.SearchSecretsAsync({
      token:token,
      searchTerm:searchTerm,
      includeDeleted: includeDeleted===true,
      includeRestricted: includeRestricted===true
    }).then(async answer=>{
      if (!context.isError(answer)){
        if (
          answer.SearchSecretsResult.SecretSummaries!==null
          && answer.SearchSecretsResult.SecretSummaries.hasOwnProperty('SecretSummary')
        ) {
          return answer.SearchSecretsResult.SecretSummaries.SecretSummary;
        }else{
          return [];
        }
      }
    });
  })
};

/**
 * Searches secrets with any of provided words in the name
 * @param searchTerms
 * @param includeDeleted
 * @param includeRestricted
 * @return {Promise.<SecretSummary[]>}
 * @constructor
 */
ThycoticSecretServerClient.prototype.SearchSecrets_union = async function(searchTerms, includeDeleted, includeRestricted){
  "use strict";
  let promises = [];
  if (typeof searchTerms==="string"){
    searchTerms = searchTerms.trim().split(" ");
  }
  let ids=[];
  let answer=[];
  searchTerms = array(searchTerms);
  for (let searchTerm of searchTerms){
    promises.push(
      this.SearchSecrets(searchTerm, includeDeleted, includeRestricted)
        .then(results=>{
          for(let result of results){
            if (!ids.hasOwnProperty(result.SecretId)){
              ids[result.SecretId]=true;
              answer.push(result);
            }
          }
        })
    );
  }

  await Promise.all(promises);
  return answer;
};

/**
 * Searches secrets with all of provided words in the name
 * @param searchTerms
 * @param includeDeleted
 * @param includeRestricted
 * @return {Promise.<SecretSummary[]>}
 * @constructor
 */
ThycoticSecretServerClient.prototype.SearchSecrets_intersect = async function(searchTerms, includeDeleted, includeRestricted){
  "use strict";
  let promises = [];
  if (typeof searchTerms==="string"){
    searchTerms = searchTerms.trim().split(" ");
  }
  let ids=[];
  let answer=[];
  searchTerms = array(searchTerms);
  for (let searchTerm of searchTerms){
    promises.push(
      this.SearchSecrets(searchTerm, includeDeleted, includeRestricted)
        .then(results=>{
          for(let result of results) {
            ids[result.SecretId] = ids[result.SecretId] ? ids[result.SecretId]+1 : 1;
            if (ids[result.SecretId]===searchTerms.length) {
              answer.push(result);
            }
          }
        })
    );
  }

  await Promise.all(promises);
  return answer;
};

/**
 * Gets folder by Id
 *
 * @param {number} folderId
 * @return {Promise.<Folder|null>}
 */
ThycoticSecretServerClient.prototype.FolderGet = async function(folderId){
  "use strict";
  return this.connection.then(connection=>{
    let {client, context, token}=connection;
    return client.FolderGetAsync({
      token:token,
      folderId:folderId,
    }).then(async answer=>{
      if (!context.isError(answer)){
        if (
          answer.FolderGetResult.Success===true &&
          answer.FolderGetResult.hasOwnProperty('Folder')
        ) {
          return answer.FolderGetResult.Folder;
        }else{
          return null;
        }
      }
    });
  })
};

/**
 * Searches folders by name
 *
 * @param {string} folderName
 * @return {Promise.<Folder[]>}
 */
ThycoticSecretServerClient.prototype.SearchFolders = async function(folderName){
  "use strict";
  return this.connection.then(connection=>{
    let {client, context, token}=connection;
    return client.SearchFoldersAsync({
      token:token,
      folderName:folderName,
    }).then(async answer=>{
      if (!context.isError(answer)){
        if (
          answer.SearchFoldersResult.Folders!==null
          && answer.SearchFoldersResult.Folders.hasOwnProperty('Folder')
        ) {
          return answer.SearchFoldersResult.Folders.Folder;
        }else{
          return [];
        }
      }
    });
  })
};

/**
 * Gets sub-folders under folder with specified parentFolderId
 *
 * @param {number} parentFolderId
 * @return {Promise.<Folder[]>}
 */
ThycoticSecretServerClient.prototype.FolderGetAllChildren = async function(parentFolderId){
  "use strict";
  return this.connection.then(connection=>{
    let {client, context, token}=connection;
    return client.FolderGetAllChildrenAsync({
      token:token,
      parentFolderId:parentFolderId,
    }).then(async answer=>{
      if (!context.isError(answer)){
        if (
          answer.FolderGetAllChildrenResult.Folders!==null
          && answer.FolderGetAllChildrenResult.Folders.hasOwnProperty('Folder')
        ) {
          return answer.FolderGetAllChildrenResult.Folders.Folder;
        }else{
          return [];
        }
      }
    });
  })
};

/**
 * Expands SecretSummary[] into Secret[]
 *
 * @param {SecretSummary[]|SecretSummary} summaries
 * @return {Promise.<Secret[]>}
 */
ThycoticSecretServerClient.prototype.SecretSummaryToSecret = async function(summaries){
  "use strict";
  if (!Array.isArray(summaries) && typeof summaries !== 'object'){
    this._exception('ARRAY_OR_ONE_EXPECTED');
  }
  let promises=[];
  for (let summary of array(summaries)){
    promises.push(this.GetSecret(summary.SecretId));
  }
  if (Array.isArray(summaries)) {
    return Promise.all(promises);
  }else{
    return promises[0]; //option when there was one SecretSummary instance instead of SecretSummary[]
  }
};

/**
 * Helper function to centralize exception generation.
 *
 * @param error
 * @private
 * @throws {string}
 */
ThycoticSecretServerClient.prototype._exception = function (error){
  "use strict";
  throw this.ERRORS.hasOwnProperty(error) ? this.ERRORS[error] : error;
};

/**
 * Helper function to parse and react on Errors in responses.
 *
 * @param {Object} answer
 * @returns {boolean}
 */
ThycoticSecretServerClient.prototype.isError = function(answer){
  "use strict";

  // Check for common Errors array
  for(
    let resultType of
    [
      'AuthenticateResult', 'GetSecretResult', 'DownloadFileAttachmentByItemIdResult', 'DownloadFileAttachmentResult',
      'SearchSecretsResult', 'SearchFoldersResult', 'FolderGetResult', 'FolderGetAllChildrenResult',
      'SearchSecretsByExposedFieldValueResult', 'SearchSecretsByExposedValuesResult', 'SearchSecretsByFieldValueResult',
      'SearchSecretsByFolderResult', 'GetSecretsByFieldValueResult', 'GetSecretsByExposedFieldValueResult',
      'GetSecretItemHistoryByFieldNameResult'
    ]
    ){
    if (answer.hasOwnProperty(resultType) && answer[resultType].hasOwnProperty('Errors') && answer[resultType].Errors) {
      this._exception(answer[resultType].Errors.string.join(",").trim());
    }
  }

  // AuthenticateResult
  if (answer.hasOwnProperty('AuthenticateResult')) {
    if (answer.AuthenticateResult.Token.length === 0) {
      this._exception('GOT_EMPTY_TOKEN');
    }
  }

  // GetSecretResult
  else if(answer.hasOwnProperty('GetSecretResult')) {
    if(answer.GetSecretResult.SecretError){
      this._exception(
        "["+answer.GetSecretResult.SecretError.ErrorCode+"] "+
        answer.GetSecretResult.SecretError.ErrorMessage + ": "+
        answer.GetSecretResult.SecretError.CommentTitle + ". "+
        answer.GetSecretResult.SecretError.AdditionalCommentTitle
      );
      // TODO: check if AllowsResponse should be added to error explanation
      // <s:element minOccurs="1" maxOccurs="1" name="AllowsResponse" type="s:boolean"/>
    }else if(!answer.GetSecretResult.Secret.hasOwnProperty('Id') || !answer.GetSecretResult.Secret.Id){
      this._exception('GOT_EMPTY_SECRET');
    }
  }

  return false;
};

/**
 * Helper function that changes SecretItems into handy associative array with all attached files inside
 *
 * @param {Object} secret
 */
ThycoticSecretServerClient.prototype.fixItems = async function(secret){
  "use strict";
  let items = {};
  //some WebAPI methods return secret with Items:null
  if (
    (
      !secret.hasOwnProperty('Items')
      || secret.Items===null
      || ( // since we are working with soap, we need to check for null really deeply
        secret.Items.hasOwnProperty('attributes')
        && secret.Items.attributes.hasOwnProperty('xsi:nil')
      )
    )
    && secret.hasOwnProperty('Id')
  ){
    let fixed = await this.GetSecret(secret.Id);
    secret.Items = Object.assign({}, fixed.Items);
    return;
  }
  for (let item of secret.Items.SecretItem){
    if (item.IsFile){
      item['Value'] = await this.DownloadFileAttachmentByItemId(secret.Id, item.Id);
    }
    items[item.FieldName]=item;
  }
  secret.Items = Object.assign({}, items); //force copy, otherwise items will get nulled after this function life
};

/**
 * Helper function that allows to provide only domain or TSS URI without full path to WSDL
 *
 * @param {string} url - domain, or ip, or domain/SecretServer
 * @return {Promise.<string>} correct URL to TSS
 */
ThycoticSecretServerClient.prototype.fixURL = async function(url){
  "use strict";
  let url_=null;
  try {
    try {
      url_ = new URL(url);
    }catch(e){
      url_ = new URL("https://"+url);
    }
    if (url_.host.length) {
      if (url_.pathname.search("SSWebService.asmx") === -1) {
        if (url_.pathname !== '/') { // let's guess that we have TSS URI already
          if (url_.pathname.substr(-1) !== '/') {
            url_.pathname=url_.pathname + "/";
          }
          url_.pathname=url_.pathname + "webservices/SSWebService.asmx";
        } else { // by default TSS is under /SecretServer/ URI
          url_.pathname="/SecretServer/webservices/SSWebService.asmx";
        }
      }
      if (!url_.searchParams.has("WSDL")) { // this one is required
        url_.search="WSDL"; // we have to assign directly, since otherwise we will get "?WSDL=" with 500 error
      }
      url = url_.href;
    } else {
      this._exception('BAD_TSS_URL');
    }
  }catch(e){
    try {
      if (isDomain(url)) { //All is ok, valid domain was provided
        url = "https://" + url + "/SecretServer/webservices/SSWebService.asmx?WSDL";
      } else if (isIP(url)) { //IP - strange, but ok
        url = "http://" + url + "/SecretServer/webservices/SSWebService.asmx?WSDL"; //there is no sense doing HTTPS on IP
      } else { // whatever you are, if you answer to me, I will work with you
        let result = await ping.promise.probe(url);
        if (result) { //let's assume that it is local host with strange name
          url = "https://" + url + "/SecretServer/webservices/SSWebService.asmx?WSDL";
        }
      }
    }catch(e){
      this._exception('BAD_TSS_URL');
    }
  }
  return url;
};

/**
 * A web method that uploads a file attachment on a Secret Server
 *
 * @param {number} secretId
 * @param {string|undefined} fileData
 * @param {string} fileName
 * @returns {Promise.<UploadFileAttachmentResult>} file object
 */
ThycoticSecretServerClient.prototype.UploadFileAttachment = async function(secretId,fileData,fileName){
  "use strict";
  return this.connection.then((connection)=>{
    let {client, context, token}=connection;
    return client.UploadFileAttachment({
      token:token,
      secretId:secretId,
      fileData:fileData,
      fileName:fileName
    });
  })
};

/**
 * @type {ThycoticSecretServerClient}
 */
module.exports = ThycoticSecretServerClient;