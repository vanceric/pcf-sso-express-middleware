## Express Middleware for Pivotal Cloud Foundry Single Sign-On

### Very much a work in progress, use/extend at your own risk!

The purpose of this module is to wrap the process of interfacing with the Single Sign-On service provided for Pivotal Cloud Foundry into a middleware for express js. 

For more information on PCF SSO visit: [PCF Single Sign-On Overview](http://docs.pivotal.io/p-identity/1-5/index.html)

### Basic Usage Example:
```javascript
'use strict'
const Port = process.env.PORT || 8080;
const AUTH_CONDITION = process.env.ENABLE_AUTH || false;

const express = require('express');
const session = require('express-session');
const PcfSSOExpressMw = require('pcf-sso-express-middleware');

const app = express();

// See Note #1
app.use(
  session({
    name: 'server-session',
    secret: 'genericSecret', // See Note #2
    saveUninitialized: true,
    resave: true
  })
);

const auth = new PcfSSOExpressMw(app);
auth.initialize(AUTH_CONDITION);

app.use(auth.middleware(req, res, next));

app.get('/*', (req, res) => {
  return 'Hello World!'
})

app.listen(Port, () => {
  console.log(`Express server started on port ${Port}`);
});
```
Notes:
1. Use an external store once in production, something like [Express-Sessions](https://github.com/konteck/express-sessions)
2. Use a secret provided via environment variables once in procudtion

### Module Dependencies:
* [Request](https://github.com/request/request)
* [Simple Oauth2](https://github.com/lelylan/simple-oauth2)

### Prerequisites:
* [Express JS Application](https://github.com/expressjs/express)
* [Express Session Implemented](https://github.com/expressjs/session)
* [Pivotal Cloud Foundry Platform for Deployment](https://pivotal.io/platform)

### Testing Tools:
* [Mocha](https://github.com/mochajs/mocha)
* [Chai](https://github.com/chaijs/chai)
* [Sinon](https://github.com/sinonjs/sinon)
* [Sinon-Chai](https://github.com/domenic/sinon-chai)
