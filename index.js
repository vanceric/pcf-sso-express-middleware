'use strict';
const request = require('request');
const simpleOauthModule = require('simple-oauth2');
const log = require('./lib/logger');

class sso_client {
  constructor(app, config) {
    this.ssoPaths = {
      tokenHost: '',
      authorizePath: '/oauth/authorize',
      tokenPath: '/oauth/token'
    };
    this.credentials = {
      id: '',
      secret: ''
    };
    this.clientPaths = {
      clientHost: '',
      clientCallback: '/callback'
    };
    this.userInfoPath = '/userinfo';
    this.scopes = ['openid'];
    this.oauth2 = {};
    this.authURI = {};
    this.app = app;
  }

  setAppScopes(scopes) {
    this.scopes = scopes;
  }

  getAppScopes() {
    return this.scopes;
  }

  middleware(req, res, next) {
    if (req.session.authorized || this.bypass) {
      next();
    } else {
      res.redirect(this.authURI);
    }
  }

  initialize(enabled) {
    if (enabled && process.env.VCAP_APPLICATION && process.env.VCAP_SERVICES) {
      this.setPathsFromVCAP(
        sso_client.parseVCAP(process.env.VCAP_APPLICATION),
        sso_client.parseVCAP(process.env.VCAP_SERVICES)
      );
      this.oauth2 = simpleOauthModule.create({
        client: this.credentials,
        auth: this.ssoPaths
      });
      this.authURI = this.oauth2.authorizationCode.authorizeURL({
        redirectURI: 'https://' + this.clientPaths.clientHost + '/callback'
      });
      this.app.get('/callback', (req, res, next) => {
        this.callback(req, res);
      });
    } else {
      this.bypass = true;
    }
  }

  setPathsFromVCAP(VCAP_APP, VCAP_SVC) {
    let services = sso_client.extractIdentity(VCAP_SVC);

    this.ssoPaths.tokenHost = services.auth_domain;
    this.credentials.id = services.client_id;
    this.credentials.secret = services.client_secret;

    this.clientPaths.clientHost = `https://${
      VCAP_APP.uris ? VCAP_APP.uris[0] : '127.0.0.1'
    }`;
  }

  callback(req, res) {
    const options = {
      code: req.query.code
    };
    this.oauth2.authorizationCode.getToken(options, (error, result) => {
      if (error) {
        log.httpError(req, error.context.error_description);
        return res.json('Authentication failed');
      }

      let scope = result.scope;

      this.grabUserInfo(result.access_token)
        .then(user => {
          req.session.user = user;
          req.session.authorized = true;
          return res.redirect('/');
        })
        .catch(err => {
          console.error(err);
        });
    });
  }

  grabUserInfo(token) {
    let { tokenHost } = this.ssoPaths;

    let options = {
      url: tokenHost + this.userInfoPath,
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    return new Promise(function(resolve, reject) {
      request.get(options, (err, res, body) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(body));
        }
      });
    });
  }

  static parseVCAP(VCAP) {
    let response = {};
    try {
      response = JSON.parse(VCAP);
    } catch (err) {
      console.error(err);
    }
    return response;
  }

  static extractIdentity(VCAP) {
    let response = {};
    if (VCAP['p-identity'] && VCAP['p-identity'][0]) {
      response = VCAP['p-identity'][0].credentials;
    }
    return response;
  }
}

module.exports = sso_client;
