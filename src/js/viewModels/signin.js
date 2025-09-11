define([
    "knockout",
    "ojs/ojcorerouter",
    "oj-c/input-text",
    "oj-c/input-password",
    "oj-c/button",
    "oj-c/form-layout",
    "oj-c/progress-circle"
],
    function (ko, CoreRouter) {
        function SignInViewModel() {
            var self = this;
            self.email = ko.observable("");
            self.password = ko.observable("");
            self.emailError = ko.observableArray([]);
            self.passwordError = ko.observableArray([]);
            self.isLoading = ko.observable(false);
            self.API_BASE = {
                USER: 'http://localhost:8085/userservice/api/v1'
            };

            // Updated showLoading function to control the loading overlay
            self.showLoading = function (show) {
                self.isLoading(show);
                console.log(show ? "Loading..." : "Loading complete");
            };

            self.showMessage = function (msg, type) {
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

            self.email.subscribe(function (newValue) {
                self.validateEmail(newValue);
            });
            self.password.subscribe(function (newValue) {
                self.validatePassword(newValue);
            });

            self.onEmailBlur = function () {
                self.validateEmail(self.email());
            };
            self.onPasswordBlur = function () {
                self.validatePassword(self.password());
            };

            self.signIn = async function () {
                var email = self.email();
                var password = self.password();
                var isEmailValid = self.validateEmail(email);
                var isPasswordValid = self.validatePassword(password);
                if (!isEmailValid || !isPasswordValid) {
                    return;
                }
                try {
                    self.showLoading(true); // Show loader
                    const response = await fetch(`${self.API_BASE.USER}/users/signin`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password })
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
                        throw new Error(errorMessage);
                    }
                    const data = await response.json();
                    var authToken = data.token;
                    var userId = data.userId;
                    sessionStorage.setItem('authToken', authToken);
                    sessionStorage.setItem('userId', userId);
                    CoreRouter.rootInstance.go({ path: "dashboard" });
                } catch (error) {
                    self.showMessage(error.message || 'Invalid email or password', 'error');
                } finally {
                    self.showLoading(false); // Hide loader
                }
            };

            self.showSignUp = function () {
                CoreRouter.rootInstance.go({ path: "signup" });
            };
        }
        return SignInViewModel;
    });