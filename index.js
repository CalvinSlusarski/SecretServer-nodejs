const soap = require('soap');

/**
 *
 * @param url
 * @param login
 * @param password
 * @constructor
 */
function ThycoticSecretServerClient (url, login, password){
  "use strict";
  let oThis = this;

  this.token=null;
  this.ERRORS={
    GOT_EMPTY_TOKEN: "Authentication resulted in empty token. That is unexpected.",
    GOT_EMPTY_SECRET: "Got empty secret with no error. That is unexpected."
  };


  this.connection = this._connect(url, login, password);

};

/**
 *
 * @param url
 * @param login
 * @param password
 * @returns {Promise.<[soap, ThycoticSecretServerClient, string]>}
 * @private
 */
ThycoticSecretServerClient.prototype._connect = async function (url, login, password){
  "use strict";
  //TODO: add url check and auto-repair
  const client = await soap.createClientAsync(url);
  let oThis = this;

  return await client.AuthenticateAsync({
    username: login,
    password: password
  }).then(async answer=>{
    if (!oThis.isError(answer)){
      //oThis.token = answer.AuthenticateResult.Token;
      return {client:client, context:oThis, token:answer.AuthenticateResult.Token};
    }
  }).catch(error=>{
    oThis._exception(error);
  });

};

/**
 *
 * @param secretId
 * @param itemId
 * @returns {Promise.<void>}
 * @constructor
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
}

/**
 *
 * @param id
 * @returns {Promise.<void>}
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
        };
        secret.Items = items;
        return secret;
      }
    });
  })
};

/**
 *
 * @param error
 * @private
 */
ThycoticSecretServerClient.prototype._exception = function (error){
  "use strict";
  throw this.ERRORS.hasOwnProperty(error) ? this.ERRORS[error] : error;
};

/**
 *
 * @param answer
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
}

exports.TSSClient = ThycoticSecretServerClient;