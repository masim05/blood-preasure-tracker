var apiBase = 'http://localhost:3000';
var response = http.post(apiBase + '/api/v1/login', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: output.signupEmail, password: output.signupPassword })
});

if (response.status !== 201) {
  throw new Error(
    'Signup API assertion failed: expected user ' +
    output.signupEmail +
    ' to exist after signup, but POST /api/v1/login returned status=' +
    response.status +
    ' body=' +
    response.body
  );
}

var data = json(response.body);
if (!data.accessToken || !data.user || data.user.email !== output.signupEmail) {
  throw new Error(
    'Signup API assertion failed: login probe response missing token or wrong email. body=' + response.body
  );
}
