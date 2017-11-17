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