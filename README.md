[![npm version](https://badge.fury.io/js/%40mr.xcray%2Fthycotic-secretserver-client.svg)](https://www.npmjs.com/package/@mr.xcray/thycotic-secretserver-client)
[![GitHub issues](https://img.shields.io/github/issues/Afigenius/SecretServer-nodejs.svg?style=flat)](https://github.com/Afigenius/SecretServer-nodejs/issues)
[![GitHub license](https://img.shields.io/github/license/Afigenius/SecretServer-nodejs.svg?style=flat)](https://github.com/Afigenius/SecretServer-nodejs/blob/master/LICENSE)

    npm i @mr.xcray/thycotic-secretserver-client

# SecretServer-nodejs
JS/NodeJS client for Thycotic Secret Server

TSS Version: 10.3.000015

##
    let {TSSClient} = require('@mr.xcray/thycotic-secretserver-client');
      
    let client = new TSSClient(
      "https://domain/SecretServer/webservices/SSWebService.asmx?WSDL", 
      "login", 
      "password"
    );
      
    client.GetSecretById(254).then(result => {
      console.log(result);
    });

## Implemented
    GetSecretById
    DownloadFileAttachmentByItemId 