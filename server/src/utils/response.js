function success(res, data = {}, status = 200) {
  return res.status(status).json({ data });
}

function failure(res, message = 'Request failed', status = 400, details) {
  return res.status(status).json({ error: { message, details } });
}

module.exports = { success, failure };


