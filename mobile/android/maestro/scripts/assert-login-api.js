var apiBase = 'http://localhost:3000';
var response = http.post(apiBase + '/api/v1/login', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'us3@example.com', password: 'password123' })
});

if (response.status !== 201) {
  throw new Error(
    'Login API assertion failed for us3@example.com: status=' +
    response.status +
    ' body=' +
    response.body
  );
}

var data = json(response.body);
if (!data.accessToken || data.tokenType !== 'Bearer' || !data.user || data.user.email !== 'us3@example.com') {
  throw new Error('Login API returned unexpected response shape: ' + response.body);
}
