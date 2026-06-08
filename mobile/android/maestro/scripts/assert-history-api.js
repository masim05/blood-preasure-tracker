var apiBase = 'http://localhost:3000';

var loginRes = http.post(apiBase + '/api/v1/login', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'us4@example.com', password: 'password123' })
});

if (loginRes.status !== 201) {
  throw new Error(
    'History API assertion: login as us4@example.com failed status=' +
    loginRes.status +
    ' body=' +
    loginRes.body
  );
}

var token = json(loginRes.body).accessToken;

var histRes = http.get(apiBase + '/api/v1/measurements', {
  headers: { Authorization: 'Bearer ' + token }
});

if (histRes.status !== 200) {
  throw new Error(
    'History API assertion failed: GET /api/v1/measurements status=' +
    histRes.status +
    ' body=' +
    histRes.body
  );
}

var payload = json(histRes.body);
if (!payload.items || !Array.isArray(payload.items)) {
  throw new Error('History API response missing items array: ' + histRes.body);
}

var match = null;
for (var i = 0; i < payload.items.length; i++) {
  var m = payload.items[i];
  if (m.systolic === 125 && m.diastolic === 82 && m.pulse === 65) {
    match = m;
    break;
  }
}

if (!match) {
  throw new Error(
    'History API assertion: us4 fixture measurement (125/82/65) not found in response. body=' +
    histRes.body
  );
}
