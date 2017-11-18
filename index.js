require('./types');
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
  };

  this.connection = this._connect(url, login, password);
}

/**
 * Starts connection sequence with error handling.
 *
 * @param {string} url
 * @param {string} login
 * @param {string} password
 * @returns {Promise.<[soap, ThycoticSecretServerClient, string]>}
 * @private
 */
ThycoticSecretServerClient.prototype._connect = async function (url, login, password){
  "use strict";

  url = await this.fixURL(url);

  let client=null;
  try {
    client = await soap.createClientAsync(url);
  }catch(e){
    this._exception('BAD_TSS_URL');
  }
  let oThis = this;

  return await client.AuthenticateAsync({
    username: login,
    password: password
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
 * @param {number} id - secret ID
 * @returns {Promise.<Secret>}
 */
ThycoticSecretServerClient.prototype.GetSecretById = async function(id){
  "use strict";
  return this.connection.then((connection)=>{
    let {client, context, token}=connection;
    return client.GetSecretAsync({
      token:token,
      secretId:id,
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
            item['Value'] = await context.DownloadFileAttachmentByItemId(id, item.Id);
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

  // DownloadFileAttachmentByItemIdResponse
  else if (answer.hasOwnProperty('DownloadFileAttachmentByItemIdResult')){
    if (answer.DownloadFileAttachmentByItemIdResult.Errors){
      this._exception(answer.DownloadFileAttachmentByItemIdResult.Errors.string.join(",").trim());
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