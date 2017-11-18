let {mockup, TSSClient, expect, runServer} = require('./mockup');
before(done=>{runServer.then(done);});

function badLogin(){
  "use strict";
  return new TSSClient("http://localhost:8001", "badlogin", "badpassword");
}

function goodLogin(){
  "use strict";
  return new TSSClient("http://localhost:8001", "goodlogin", "goodpassword");
}

describe("Authenticate", function(){
  it('badlogin/badpassword should fail with "Login failed"', function() {
    return expect(badLogin().connection).to.eventually.be.rejectedWith('Login failed.');
  });
  it('goodlogin/goodpassword should result in good token', function() {
    return expect(goodLogin().connection).to.eventually.have.property('token');
  });
});

describe("GetSecretById", function(){

  it('it should fail for non-existent secret', function() {
    return expect(goodLogin().GetSecretById(999)).to.eventually.be.rejectedWith('Access Denied');
  });

  it('it should return existent secret', function() {
    return expect(goodLogin().GetSecretById(1)).to.eventually.have.property("Id")
  });

  it('secret with file attached should have Value.FileAttachment property', function() {
    return expect(goodLogin().GetSecretById(1)).to.eventually
      .have.property("Items")
      .that.has.property("File")
        .that.has.property("Value")
        .that.has.property('FileAttachment')
          .that.is.equal('ok')
  })
});

after(function() {
  mockup.close();
});