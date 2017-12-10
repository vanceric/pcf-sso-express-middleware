'use strict';

class sso_client {
  constructor(app, config) {
    this.ssoPaths = {
      tokenHost: '',
      authorizePath: '/oauth/authorize',
      tokenPath: '/oauth/token',
      userInfoPath: '/userinfo'
    };
    this.credentials = {
      id: '',
      secret: ''
    };
    this.clientPaths = {
      clientHost: '',
      clientCallback: '/callback'
    };
    this.scopes = ['openid'];
  }

  setAppScopes(scopes) {
    this.scopes = scopes;
  }

  getAppScopes() {
    return this.scopes;
  }

  getAppRoutes() {
    return true;
  }

  middleware(req, res, next) {
    if (req.session.authorized) {
      next();
    } else {
      res.redirect(authURI);
    }
  }

  initialize(enabled) {
    if (enabled && process.env.VCAP_APPLICATION && process.env.VCAP_SERVICES) {
      this.setPathsFromVCAP(
        sso_client.parseVCAP(process.env.VCAP_APPLICATION),
        sso_client.parseVCAP(process.env.VCAP_SERVICES)
      );
    }
  }

  setPathsFromVCAP(VCAP_APP, VCAP_SVC) {
    this.clientPaths.clientHost = `https://${
      VCAP_APP.uris ? VCAP_APP.uris[0] : '127.0.0.1'
    }`;
    this.ssoPaths.tokenHost = extractIdentity(VCAP_SVC).auth_domain;
    this.credentials.id = extractIdentity(VCAP_SVC).client_id;
    this.credentials.secret = extractIdentity(VCAP_SVC).client_secret;
  }

  callBack(req, res) {
    const options = {
      code: req.query.code
    };
    oauth2.authorizationCode.getToken(options, (error, result) => {
      if (error) {
        console.error('Access Token Error', error);
        return res.json('Authentication failed');
      }

      let scope = result.scope;

      grabUserInfo(result.access_token)
        .then(result => {
          req.session.user = result;
          if (scope === 'openid') {
            req.session.authorize = true;
          }
          return res.redirect('/');
        })
        .catch(err => {
          console.error(err);
        });
    });
  }

  grabUserInfo(token) {
    let { auth_domain, userInfoPath } = this.ssoPaths;
    let options = {
      url: auth_domain + userInfoPath,
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
    if (VCAP['p-identity'] && VCAP_SVC['p-identity'][0]) {
      response = VCAP_SVC['p-identity'][0].credentials;
    }
    return response;
  }
}

module.exports = sso_client;
