module.exports = {
  info: function() {
    console.log.apply(console, Array.prototype.slice.call(arguments));
  },

  error: function() {
    console.error.apply(console, Array.prototype.slice.call(arguments));
  },

  httpError: function(req, type) {
    let { element } = this;

    let result = `Event Occurred:
    ${element('Timestamp', new Date().toISOString())}
    ${element('SessionID', req.sessionID)}
    ${element('Endpoint', req.originalUrl)}
    ${element('Method', req.method)}
    ${element('RemoteAddress', req.connection.remoteAddress)}
    ${element('ErrorType', type)}`;

    this.error(result.replace(/(\r\n|\n|\r)/gm, ''));
  },

  element: function(name, value) {
    value = value || 'Unknown';
    return `${name}=[${value}]`;
  }
};
