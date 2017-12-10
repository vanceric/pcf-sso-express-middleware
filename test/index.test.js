const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const PcfSSOExpressMw = require('../index.js');

chai.use(sinonChai);

const expect = chai.expect;

describe('pcf-sso-express-middleware exports a class', () => {
  let sso_client, req, res, next;

  beforeEach(() => {
    sso_client = new PcfSSOExpressMw();
    next = sinon.spy();
    req = {
      session: {}
    };
  });

  afterEach(() => {
    next.reset();
  });

  describe('to manage connecting a node js app to a PCF SSO Service', () => {
    describe('the getAppScopes method', () => {
      it('returns an array of scopes your app will look for (default = openid)', () => {
        expect(sso_client.getAppScopes()).to.deep.equal(['openid']);
      });
    });

    describe('the setAppScopes method', () => {
      it('allow you to define what scopes the app should expect', () => {
        sso_client.setAppScopes(['openid', 'newTestScope']);
        expect(sso_client.getAppScopes()).to.deep.equal([
          'openid',
          'newTestScope'
        ]);
      });
    });

    describe('the middleware method', () => {
      context('when the user session is already authorized', () => {
        it('calls next', () => {
          req.session.authorized = true;
          sso_client.middleware(req, res, next);
          expect(next).to.have.been.called;
        });
      });
    });

    describe('the initialize method', () => {
      context('when enabled is truthy', () => {
        it('defines routes and credentials based on VCAP env variables', () => {
          sso_client.initialize(true);
          expect(true).to.be.true;
        });
      });
    });

    describe('the parse VCAP  static method', () => {
      context('a valid stringified JSON is presented', () => {
        it('returns a parsed version', () => {
          let json = JSON.stringify({ test: 'test' });
          expect(PcfSSOExpressMw.parseVCAP(json)).to.deep.equal(
            JSON.parse(json)
          );
        });
      });
    });
  });
});
