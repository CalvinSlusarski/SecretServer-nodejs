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
 * @param url
 * @param login
 * @param password
 * @constructor
 */
function ThycoticSecretServerClient (url, login, password){
  "use strict";
  //TODO: add organization and domain params to comply with Authenticate method

  this.ERRORS={
    GOT_EMPTY_TOKEN: "Authentication resulted in empty token. That is unexpected.",
    GOT_EMPTY_SECRET: "Got empty secret with no error. That is unexpected.",
    BAD_TSS_URL: "It seems that TSS URL provided is incorrect",
    ARRAY_OR_ONE_EXPECTED: "Argument expected to be an array or object."
  };

  this.connection = this._connect(url, login, password);
}

/**
 * Starts connection sequence with error handling.
 *
 * @param {string} url
 * @param {string} login - The username for authentication (required)
 * @param {string} password - The password for authentication (required)
 * @param {?string} organization - The organization code if using Secret Server Online. For installed Secret Server, you must specify null or an
 empty string or authentication will fail (not required)
 * @param {?string} domain - The domain if attempting to authenticate using a domain account. For non-domain accounts, passing null,
 empty string, or “(local)” indicates it is not a domain account. (not required)
 * @returns {Promise.<[soap, ThycoticSecretServerClient, string]>}
 * @private
 */
ThycoticSecretServerClient.prototype._connect = async function (url, login, password, organization, domain){
  "use strict";

  url = await this.fixURL(url);

  let client=null;
  try {
    client = await soap.createClientAsync(url);
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
 * Downloads file attached to secret.
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
        let items = {};
        for (let item of secret.Items.SecretItem){
          if (item.IsFile){
            item['Value'] = await context.DownloadFileAttachmentByItemId(secretId, item.Id);
          }
          items[item.FieldName]=item;
        }
        secret.Items = items;
        return secret;
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
 * @return {Promise.<Secret[]>}
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
 * @return {Promise.<void>}
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
 * @return {Promise.<void>}
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

  // AuthenticateResult
  if (answer.hasOwnProperty('AuthenticateResult')) {
    if (answer.AuthenticateResult.Errors) {
      this._exception(answer.AuthenticateResult.Errors.string.join(",").trim());
    } else if (answer.AuthenticateResult.Token.length === 0) {
      this._exception('GOT_EMPTY_TOKEN');
    }
  }

  // GetSecretResult
  else if(answer.hasOwnProperty('GetSecretResult')) {
    if (answer.GetSecretResult.Errors){
      this._exception(answer.GetSecretResult.Errors.string.join(",").trim());
    }else if(answer.GetSecretResult.SecretError){
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

  // DownloadFileAttachmentByItemIdResult
  else if (answer.hasOwnProperty('DownloadFileAttachmentByItemIdResult')){
    if (answer.DownloadFileAttachmentByItemIdResult.Errors){
      this._exception(answer.DownloadFileAttachmentByItemIdResult.Errors.string.join(",").trim());
    }
  }

  // SearchSecretsResult
  else if (answer.hasOwnProperty('SearchSecretsResult')){
    if (answer.SearchSecretsResult.Errors){
      this._exception(answer.SearchSecretsResult.Errors.string.join(",").trim());
    }
  }

  // SearchFoldersResult
  else if (answer.hasOwnProperty('SearchFoldersResult')){
    if (answer.SearchFoldersResult.Errors){
      this._exception(answer.SearchFoldersResult.Errors.string.join(",").trim());
    }
  }

  return false;
};

/**
 * Helper function that allows to provide only domain or TSS URI without full path to WSDL
 *
 * @param {string} url - domain, or ip, or domain/SecretServer
 * @return {Promise.<{string}>} correct URL to TSS
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
 * @type {ThycoticSecretServerClient}
 */
exports.TSSClient = ThycoticSecretServerClient;