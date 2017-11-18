const xml = require('fs').readFileSync('test/SSWebService-10.3.15.xml', 'utf8');
const soap = require('soap');
const mockup = require('http').createServer(function(request,response) {
  response.end('404: Not Found: ' + request.url);
});

var myService = {
  SSWebService: {
    SSWebServiceSoap: {
      Authenticate: function(args, callback) {
        if (args.username==="goodlogin" && args.password==="goodpassword"){
          callback({
            AuthenticateResult: {
              Token: 'goodtoken'
            }
          });
        }else {
          callback({
            AuthenticateResult: {
              Errors: {
                string: ['Login failed.']
              }
            }
          });
        }
      },

      DownloadFileAttachmentByItemId: function(args, callback){
        "use strict";
        callback({
          DownloadFileAttachmentByItemIdResult:{
            FileAttachment: 'ok',
            FileName: 'filename'
          }
        });
      },

      GetSecret: function(args, callback){
        "use strict";
        if (args.secretId===1) {
          callback({
            GetSecretResult: {
              Secret: {
                Name:'Secret',
                Id:1,
                SecretTypeId:1,
                FolderId:1,
                IsWebLauncher:false,
                CheckOutMinutesRemaining:0,
                IsCheckedOut:false,
                CheckOutUserDisplayName: '',
                CheckOutUserId: 0,
                IsOutOfSync: false,
                IsRestricted: false,
                OutOfSyncReason:'',
                SecretSettings: [],
                SecretPermissions: [],
                Active: true,
                Items: {
                  SecretItem: [
                    {
                      Id: 1,
                      FieldId: 1,
                      FieldName: 'File',
                      IsFile: true,
                      IsNotes: false,
                      IsPassword: false,
                      FieldDisplayName: 'File'
                    }
                  ]
                }
              }
            }
          });
        }else{
          callback({
            GetSecretResult: {
              Errors: {
                string: ['Access Denied']
              }
            }
          });
        }
      }
    }
  }
};

exports.mockup = mockup;
exports.TSSClient = require('@mr.xcray/thycotic-secretserver-client').TSSClient;
exports.chai = require('chai');
exports.expect = exports.chai.expect;
let chaiAsPromised = require("chai-as-promised");
exports.chai.use(chaiAsPromised);
exports.soap = soap;

exports.runServer = new Promise((success)=>{
  "use strict";
  mockup.listen(8001);
  soap.listen(mockup, '/SecretServer/webservices/SSWebService.asmx', myService, xml);
  success();
});