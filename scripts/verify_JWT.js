//Function to make sure the JWT token in the local storage is valid and not expired, if not, redirect to the login page

function verifyJWT() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp < Date.now() / 1000) { // Check for token expiration
          redirectToLogin();
          return false;
        }
        return true;
      } catch {
        redirectToLogin();
        return false;
      }
}

verifyJWT();

function redirectToLogin() {
    localStorage.removeItem('token');
    window.location.href = '/login.html'; //TODO: Add a redirect param so that the login can tell the user they were signed out due to inactivity
  }