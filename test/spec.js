var sinon = require('sinon'),
    expect = require('chai').expect,
    server = require('../../index'),
    util   = require('util'),
    request = require('request');


server.createServer(8888);

describe("ping test", function () {
  var testurl = "http://localhost:8888/test1";

  it("responds to ping", function(done) {
    request(testurl, function(error, response, body) {
      expect(response.statusCode).to.eq(200);
    });
  });
});
