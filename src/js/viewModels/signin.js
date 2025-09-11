define([
    "knockout",
    "ojs/ojcorerouter",
    "oj-c/input-text",
    "oj-c/input-password",
    "oj-c/button",
    "oj-c/form-layout",
],
    function (ko, CoreRouter) {
        function SignInViewModel() {
            var self = this;
            self.email = ko.observable("");
            self.password = ko.observable("");
            // Observables for storing validation errors to bind to UI
            self.emailError = ko.observableArray([]);
            self.passwordError = ko.observableArray([]);
            self.API_BASE = {
                USER: 'http://localhost:8085/userservice/api/v1'
            };
            // Utility to show loading state (can be expanded with UI if needed)
            self.showLoading = function (show) {
                // Placeholder for loading overlay logic if needed
                console.log(show ? "Loading..." : "Loading complete");
            };
            // Utility to show general messages (temporary placeholder for UI feedback)
            self.showMessage = function (msg, type) {
                // Placeholder for success/error message display
                console.log(type + ": " + msg);
                alert(type === 'success' ? 'Success: ' + msg : 'Error: ' + msg);
            };
            // Email Validator Function
            self.validateEmail = function (email) {
                self.emailError([]); // Clear previous errors
                if (!email) {
                    self.emailError.push({ summary: "Email Required", detail: "Please enter your email address." });
                    return false;
                }
                // Email format validation using regex
                var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(email)) {
                    self.emailError.push({ summary: "Invalid Email", detail: "Please enter a valid email address (e.g., user@domain.com)." });
                    return false;
                }
                return true;
            };
            // Password Validator Function
            self.validatePassword = function (password) {
                self.passwordError([]); // Clear previous errors
                if (!password) {
                    self.passwordError.push({ summary: "Password Required", detail: "Please enter your password." });
                    return false;
                }
                if (password.length < 6) {
                    self.passwordError.push({ summary: "Password Too Short", detail: "Password must be at least 6 characters long." });
                    return false;
                }
                return true;
            };
            // Real-time validation as user types
            self.email.subscribe(function (newValue) {
                self.validateEmail(newValue); // Validate on every change
            });
            self.password.subscribe(function (newValue) {
                self.validatePassword(newValue); // Validate on every change
            });
            // Validation on blur (optional, as real-time is already covered by subscribe)
            self.onEmailBlur = function () {
                self.validateEmail(self.email());
            };
            self.onPasswordBlur = function () {
                self.validatePassword(self.password());
            };
            // Sign In function with validation
            self.signIn = async function () {
                var email = self.email();
                var password = self.password();
                var isEmailValid = self.validateEmail(email);
                var isPasswordValid = self.validatePassword(password);
                if (!isEmailValid || !isPasswordValid) {
                    return;
                }
                try {
                    self.showLoading(true);
                    const response = await fetch(`${self.API_BASE.USER}/users/signin`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password })
                    });
                    if (!response.ok) {
                        // Attempt to parse error response body
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
                        throw new Error(errorMessage);
                    }
                    const data = await response.json();
                    var authToken = data.token;
                    var userId = data.userId;
                    sessionStorage.setItem('authToken', authToken);
                    sessionStorage.setItem('userId', userId);
                    // Navigate to dashboard using CoreRouter
                    CoreRouter.rootInstance.go({ path: "dashboard" });
                } catch (error) {
                    self.showMessage(error.message || 'Invalid email or password', 'error');
                } finally {
                    self.showLoading(false);
                }
            };
            // Placeholder for navigation to Sign Up page
            self.showSignUp = function () {
                // Navigate to signup page using CoreRouter
                CoreRouter.rootInstance.go({ path: "signup" });
            };
        }
        return SignInViewModel;
    });