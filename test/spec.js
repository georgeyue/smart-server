var sinon = require('sinon'),
    expect = require('chai').expect,
    server = require('../index'),
    util   = require('util'),
    request = require('request');


server.init({
  port: 8888,
  tplDir: 'templates'
})
server.start();

describe("create_object test", function () {

  it('simple test', function() {
    var obj = {};
    server.create_object(obj, ['a', 'b']);
    expect( obj ).to.have.deep.property('a');
  });


  it('complicated test', function() {
    var obj = {};
    server.create_object(obj, ['a','b','c','d'], 1);
    expect(obj).to.have.deep.property('a.b.c.d');
  });

  it('able to work with duplicate keys', function() {
    var obj = {b:{b:{b:'c'}}};
    server.create_object(obj, ['a', 'b']);
    server.create_object(obj, ['b', 'a']);
    expect(obj).to.have.deep.property('a.b');
    expect(obj).to.have.deep.property('b.b.b', 'c');
    expect(obj).to.have.deep.property('b.a');
  });

  it('very simple', function() {
    var obj = {};
    server.create_object(obj, ['a']);
    expect(obj).to.have.deep.property('a');
  });

});

describe("simple URL GET", function () {
  var testurl = "http://localhost:8888/test1";

  it("responds to ping", function(done) {
    request(testurl, function(error, response, body) {
      expect(response.statusCode).to.eq(200);
      expect(body).to.eq('{"a":{"b":"123"}}');
      done();
    });
  });
});
