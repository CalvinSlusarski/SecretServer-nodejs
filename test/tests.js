let {mockup, TSSClient, expect, runServer} = require('./mockup');
before(done=>{runServer.then(done);});

function badLogin(){
  "use strict";
  return new TSSClient("http://localhost:8001", "badlogin", "badpassword");
}

function goodLogin(){
  "use strict";
  if (typeof goodLogin.connection === 'undefined'){ // to not to flood server with connections
    goodLogin.connection=new TSSClient("http://localhost:8001", "goodlogin", "goodpassword");
  }
  return goodLogin.connection;
}

describe("Authenticate", function(){
  "use strict";
  it('badlogin/badpassword should fail with "Login failed"', function() {
    return expect(badLogin().connection).to.eventually.be.rejectedWith('Login failed.');
  });
  it('goodlogin/goodpassword should result in good token', function() {
    return expect(goodLogin().connection).to.eventually.have.property('token');
  });
});

describe("GetSecret", function(){
  "use strict";
  it('it should fail for non-existent secret', function() {
    return expect(goodLogin().GetSecret(999)).to.eventually.be.rejectedWith('Access Denied');
  });

  it('it should return existent secret', function() {
    return expect(goodLogin().GetSecret(1)).to.eventually.have.property("Id")
  });

  it('secret with file attached should have Value.FileAttachment property', function() {
    return expect(goodLogin().GetSecret(1)).to.eventually
      .have.property("Items")
      .that.has.property("File")
        .that.has.property("Value")
        .that.has.property('FileAttachment')
          .that.is.equal('ok')
  });
});

describe("SearchSecrets", function(){
  "use strict";
  it('it should return empty array if there is no matches', function(){
    return expect(goodLogin().SearchSecrets("nosuchsecret")).to.eventually.to.be.an('array').that.is.empty;
  });
  it('it should return match for existent Secret', function(){
    return expect(goodLogin().SearchSecrets("Secret")).to.eventually
      .have.property(0)
        .that.has.property('SecretId')
          .that.is.equal(1);
  });
});

describe("SearchFolders", function(){
  "use strict";
  it('it should return empty array if there is no matches', function(){
    return expect(goodLogin().SearchFolders("nosuchfolder")).to.eventually.to.be.an('array').that.is.empty;
  });
  it('it should return match for existent Folders', function(){
    return expect(goodLogin().SearchFolders("")).to.eventually
      .have.property(0)
        .that.has.property('Id')
          .that.is.equal(1);
  });
});

describe("FolderGetAllChildren", function(){
  "use strict";
  it('it should result in error if there is no matches', function(){
    return expect(goodLogin().FolderGetAllChildren(999)).to.eventually.be.rejectedWith('The folder does not exist or user does not have access.');
  });
  it('it should return matches for existent Folder', function(){
    return expect(goodLogin().FolderGetAllChildren(-1)).to.eventually
      .have.property(0)
        .that.has.property('Id')
          .that.is.equal(1);
  });
});

describe("FolderGet", function(){
  "use strict";
  it('it should return null if there is no matches', function(){
    return expect(goodLogin().FolderGet(999)).to.eventually.to.be.null;
  });
  it('it should return match for existent Folder', function(){
    return expect(goodLogin().FolderGet(1)).to.eventually.have.property('Id')
  });
});

describe("SearchSecretsByFolder", function(){
  "use strict";
  it('it should return empty array if there is no matches', function(){
    return expect(goodLogin().SearchSecretsByFolder("nosuchsecret", 999)).to.eventually.to.be.an('array').that.is.empty;
  });
  it('it should return match for existent Secret', function(){
    return expect(goodLogin().SearchSecretsByFolder("Secret", 1)).to.eventually
      .have.property(0)
      .that.has.property('SecretId')
      .that.is.equal(1);
  });
});

describe("SearchSecretsByFieldValue", function(){
  "use strict";
  it('it should return empty array if there is no matches', function(){
    return expect(goodLogin().SearchSecretsByFieldValue("Secret Name", "nosuchsecret")).to.eventually.to.be.an('array').that.is.empty;
  });
  it('it should return match for existent Secret', function(){
    return expect(goodLogin().SearchSecretsByFieldValue("Secret Name", "Secret")).to.eventually
      .have.property(0)
      .that.has.property('SecretId')
      .that.is.equal(1);
  });
});

describe("GetSecretsByFieldValue", function(){
  "use strict";
  it('it should return empty array if there is no matches', function(){
    return expect(goodLogin().GetSecretsByFieldValue("Secret Name", "nosuchsecret")).to.eventually.to.be.an('array').that.is.empty;
  });
  it('it should return match for existent Secret', function(){
    return expect(goodLogin().GetSecretsByFieldValue("Secret Name", "Secret")).to.eventually
      .have.property(0)
      .that.has.property('Id')
      .that.is.equal(1);
  });
});

describe("SearchSecretsByExposedValues", function(){
  "use strict";
  it('it should return empty array if there is no matches', function(){
    return expect(goodLogin().SearchSecretsByExposedValues("nosuchsecret")).to.eventually.to.be.an('array').that.is.empty;
  });
  it('it should return match for existent Secret', function(){
    return expect(goodLogin().SearchSecretsByExposedValues("Secret")).to.eventually
      .have.property(0)
      .that.has.property('SecretId')
      .that.is.equal(1);
  });
});

describe("GetSecretsByExposedFieldValue", function(){
  "use strict";
  it('it should return empty array if there is no matches', function(){
    return expect(goodLogin().GetSecretsByExposedFieldValue("Secret Name", "nosuchsecret")).to.eventually.to.be.an('array').that.is.empty;
  });
  it('it should return match for existent Secret', function(){
    return expect(goodLogin().GetSecretsByExposedFieldValue("Secret Name", "Secret")).to.eventually
      .have.property(0)
      .that.has.property('Id')
      .that.is.equal(1);
  });
});

describe("SearchSecretsByExposedFieldValue", function(){
  "use strict";
  it('it should return empty array if there is no matches', function(){
    return expect(goodLogin().SearchSecretsByExposedFieldValue("Secret Name", "nosuchsecret")).to.eventually.to.be.an('array').that.is.empty;
  });
  it('it should return match for existent Secret', function(){
    return expect(goodLogin().SearchSecretsByExposedFieldValue("Secret Name", "Secret")).to.eventually
      .have.property(0)
      .that.has.property('SecretId')
      .that.is.equal(1);
  });
});

after(function() {
  mockup.close();
});