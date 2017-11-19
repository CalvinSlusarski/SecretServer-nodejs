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

      SearchFolders: function(args, callback){
        "use strict";
        if (args.folderName==="nosuchfolder"){
          callback({
            SearchFoldersResult: {
              Folders: null
            }
          });
        }else {
          callback({
            SearchFoldersResult: {
              Folders: {
                Folder: [
                  {
                    Id: 1,
                    Name: 'Personal Folders',
                    TypeId: 1,
                    ParentFolderId: -1
                  },
                  {
                    Id: 23,
                    Name: 'Персональная папка',
                    TypeId: 1,
                    ParentFolderId: -1
                  }
                ]
              }
            }
          })
        }
      },

      FolderGetAllChildren: function(args, callback){
        "use strict";
        if (args.parentFolderId!==-1){
          callback({
            FolderGetAllChildrenResult: {
              Errors: {
                string: ['The folder does not exist or user does not have access.']
              }
            }
          });
        }else {
          callback({
            FolderGetAllChildrenResult: {
              Folders: {
                Folder: [
                  {
                    Id: 1,
                    Name: 'Personal Folders',
                    TypeId: 1,
                    ParentFolderId: -1
                  },
                  {
                    Id: 23,
                    Name: 'Персональная папка',
                    TypeId: 1,
                    ParentFolderId: -1
                  }
                ]
              }
            }
          })
        }
      },

      FolderGet: function(args, callback){
        "use strict";
        if (args.folderId!==1){
          callback({
            FolderGetResult: {
              Success:false,
              Folder: null
            }
          });
        }else {
          callback({
            FolderGetResult: {
              Success:true,
              Folder:{
                Id: 1,
                Name: 'Personal Folders',
                TypeId: 1,
                ParentFolderId: -1
              }
            }
          })
        }
      },

      SearchSecrets: function(args, callback){
        "use strict";
        if (args.searchTerm!=="Secret"){
          callback({
            SearchSecretsResult: {
              SecretSummaries: null
            }
          });
        }else{
          callback({
            SearchSecretsResult: {
              SecretSummaries: {
                SecretSummary: [
                  {
                    SecretId: 1,
                    SecretName: 'Secret',
                    SecretTypeName: '',
                    SecretTypeId: 1,
                    FolderId: 1,
                    IsRestricted: false
                  }
                ]
              }
            }
          });
        }
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
exports.TSSClient = require('../index.js').TSSClient;
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
exports.stopServer = new Promise((success)=>{
  "use strict";
  mockup.listen(8001);
  soap.listen(mockup, '/SecretServer/webservices/SSWebService.asmx', myService, xml);
  success();
});