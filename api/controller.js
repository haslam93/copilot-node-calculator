'use strict';

exports.calculate = function(req, res) {
  req.app.use(function(err, _req, res, next) {
    if (res.headersSent) {
      return next(err);
    }

    res.status(400);
    res.json({ error: err.message });
  });

  // TODO: Add operator
  var operations = {
    'add':      function(a, b) { return Number(a) + Number(b) },
    'subtract': function(a, b) { return a - b },
    'multiply': function(a, b) { return a * b },
    'divide':   function(a, b) { return a / b },
    'power':    function(a, b) { return Math.pow(a, b) },
    'sqrt':     function(a) { return Math.sqrt(a) },
    'sin':      function(a) { return Math.sin(a) },
    'cos':      function(a) { return Math.cos(a) },
    'tan':      function(a) { return Math.tan(a) },
    'log':      function(a) { return Math.log10(a) },
    'ln':       function(a) { return Math.log(a) },
  };

  var singleOperandOps = ['sqrt', 'sin', 'cos', 'tan', 'log', 'ln'];

  if (!req.query.operation) {
    throw new Error("Unspecified operation");
  }

  var operation = operations[req.query.operation];

  if (!operation) {
    throw new Error("Invalid operation: " + req.query.operation);
  }

  if (!req.query.operand1 ||
      !req.query.operand1.match(/^(-)?[0-9.]+(e(-)?[0-9]+)?$/) ||
      req.query.operand1.replace(/[-0-9e]/g, '').length > 1) {
    throw new Error("Invalid operand1: " + req.query.operand1);
  }

  // Only validate operand2 for operations that require two operands
  if (!singleOperandOps.includes(req.query.operation)) {
    if (!req.query.operand2 ||
        !req.query.operand2.match(/^(-)?[0-9.]+(e(-)?[0-9]+)?$/) ||
        req.query.operand2.replace(/[-0-9e]/g, '').length > 1) {
      throw new Error("Invalid operand2: " + req.query.operand2);
    }
  }

  res.json({ result: operation(req.query.operand1, req.query.operand2) });
};
