/*
    Document   : SignInViewModel
    Created on : Sep 9, 2025
    Author     : Jayatheerth P Z
    Description:
        Handles user authentication, form validation, and navigation for the Sign In page.
*/

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
        /**
         * ViewModel for the Sign In page.
         * Handles user authentication, form validation, and navigation.
         */
        function SignInViewModel() {
            var self = this;
            self.email = ko.observable("");
            self.password = ko.observable("");
            self.emailError = ko.observableArray([]);
            self.passwordError = ko.observableArray([]);
            self.isLoading = ko.observable(true);
            self.API_BASE = {
                USER: 'http://localhost:8085/userservice/api/v1'
            };

            /**
             * Controls the visibility of the loading overlay.
             * @param {boolean} show - True to show the loading overlay, false to hide it.
             */
            self.showLoading = function (show) {
                self.isLoading(show);
            };

            /**
             * Displays a message to the user via an alert.
             * @param {string} msg - The message to display.
             * @param {string} type - The type of message ('success' or 'error').
             */
            self.showMessage = function (msg, type) {
                alert(type === 'success' ? 'Success: ' + msg : 'Error: ' + msg);
            };

            /**
             * Validates the email input.
             * @param {string} email - The email address to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateEmail = function (email) {
                self.emailError([]);
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

            /**
             * Validates the password input.
             * @param {string} password - The password to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validatePassword = function (password) {
                self.passwordError([]);
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

            // Subscribe to input changes for real-time validation
            self.email.subscribe(function (newValue) {
                self.validateEmail(newValue);
            });
            self.password.subscribe(function (newValue) {
                self.validatePassword(newValue);
            });

            /**
             * Validates email on blur event.
             */
            self.onEmailBlur = function () {
                self.validateEmail(self.email());
            };

            /**
             * Validates password on blur event.
             */
            self.onPasswordBlur = function () {
                self.validatePassword(self.password());
            };

            /**
             * Handles the sign-in process by validating inputs and making an API call.
             * Redirects to dashboard on success, shows error message on failure.
             */
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
                    self.showLoading(false);
                }
            };

            /**
             * Navigates to the Sign Up page.
             */
            self.showSignUp = function () {
                CoreRouter.rootInstance.go({ path: "signup" });
            };
        }
        return SignInViewModel;
    });