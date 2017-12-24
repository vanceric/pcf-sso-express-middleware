const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const logging = require('../lib/logger');

chai.use(sinonChai);

const expect = chai.expect;

describe('lib/logger', () => {
  let err, req;
  beforeEach(() => {
    req = {
      sessionID: 'testSessionId',
      connection: {
        remoteAddress: '192.168.1.1'
      },
      originalUrl: 'testEndpoint',
      method: 'TEST'
    };
    err = sinon.stub(logging, 'error');
  });
  afterEach(() => {
    err.restore();
  });

  describe('contains functions to assist server logging', () => {
    describe('httpError prepares and calls logs for http errors', () => {
      it('inserts the session ID', () => {
        logging.httpError(req);
        expect(err).to.have.been.calledWith(sinon.match('testSessionId'));
      });
      it('inserts the remote ip address', () => {
        logging.httpError(req);
        expect(err).to.have.been.calledWith(sinon.match('192.168.1.1'));
      });
      it('inserts the endpoint attempted', () => {
        logging.httpError(req);
        expect(err).to.have.been.calledWith(sinon.match('testEndpoint'));
      });
      it('inserts the method attempted', () => {
        logging.httpError(req);
        expect(err).to.have.been.calledWith(sinon.match('TEST'));
      });
      it('inserts the type of error if supplied', () => {
        logging.httpError(req, 'user failed login');
        expect(err).to.have.been.calledWith(sinon.match('user failed login'));
      });
    });
  });
});
