/*
    Document   : SignUpViewModel
    Created on : Sep 9, 2025
    Author     : Jayatheerth P Z
    Description:
        Manages user registration, form validation, and navigation for the Sign Up page.
*/

define([
    "knockout",
    "ojs/ojcorerouter",
    "oj-c/input-text",
    "oj-c/input-password",
    "oj-c/text-area",
    "oj-c/button",
    "oj-c/form-layout",
    "oj-c/input-date-picker",
],
    function (ko, CoreRouter) {
        /**
         * ViewModel for the Sign Up page.
         * Manages user registration, form validation, and navigation.
         */
        function SignUpViewModel() {
            var self = this;
            // Observables for form fields
            self.fullName = ko.observable("");
            self.email = ko.observable("");
            self.phoneNumber = ko.observable("");
            self.dateOfBirth = ko.observable();
            self.password = ko.observable("");
            self.address = ko.observable("");
            // Observables for validation errors
            self.fullNameError = ko.observableArray([]);
            self.emailError = ko.observableArray([]);
            self.phoneNumberError = ko.observableArray([]);
            self.passwordError = ko.observableArray([]);
            self.addressError = ko.observableArray([]);
            // Observable for loading state
            self.isLoading = ko.observable(false);
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
             * Validates the full name input.
             * @param {string} fullName - The full name to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateFullName = function (fullName) {
                self.fullNameError([]);
                var trimmedFullName = fullName ? fullName.trim() : "";
                if (!trimmedFullName) {
                    self.fullNameError.push({ summary: "Full Name Required", detail: "Please enter your full name." });
                    return false;
                }
                if (trimmedFullName.length < 2) {
                    self.fullNameError.push({ summary: "Full Name Too Short", detail: "Full name must be at least 2 characters long after trimming." });
                    return false;
                }
                return true;
            };

            /**
             * Validates the email input.
             * @param {string} email - The email address to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateEmail = function (email) {
                self.emailError([]);
                var trimmedEmail = email ? email.trim() : "";
                if (!trimmedEmail) {
                    self.emailError.push({ summary: "Email Required", detail: "Please enter your email address." });
                    return false;
                }
                var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(trimmedEmail)) {
                    self.emailError.push({ summary: "Invalid Email", detail: "Please enter a valid email address (e.g., user@domain.com)." });
                    return false;
                }
                return true;
            };

            /**
             * Validates the phone number input.
             * @param {string} phoneNumber - The phone number to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validatePhoneNumber = function (phoneNumber) {
                self.phoneNumberError([]);
                var trimmedPhoneNumber = phoneNumber ? phoneNumber.trim() : "";
                if (!trimmedPhoneNumber) {
                    self.phoneNumberError.push({ summary: "Phone Number Required", detail: "Please enter your phone number." });
                    return false;
                }
                var phoneRegex = /^\+?[0-9]{10,15}$/;
                if (!phoneRegex.test(trimmedPhoneNumber)) {
                    self.phoneNumberError.push({ summary: "Invalid Phone Number", detail: "Phone number must be between 10 and 15 digits." });
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
                var trimmedPassword = password ? password.trim() : "";
                if (!trimmedPassword) {
                    self.passwordError.push({ summary: "Password Required", detail: "Please enter a password." });
                    return false;
                }
                if (trimmedPassword.length < 6) {
                    self.passwordError.push({ summary: "Password Too Short", detail: "Password must be at least 6 characters long." });
                    return false;
                }
                return true;
            };

            /**
             * Validates the address input.
             * @param {string} address - The address to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateAddress = function (address) {
                self.addressError([]);
                var trimmedAddress = address ? address.trim() : "";
                if (!trimmedAddress) {
                    self.addressError.push({ summary: "Address Required", detail: "Please enter your address." });
                    return false;
                }
                if (trimmedAddress.length < 5) {
                    self.addressError.push({ summary: "Address Too Short", detail: "Address must be at least 5 characters long after trimming." });
                    return false;
                }
                return true;
            };

            // Subscribe to input changes for real-time validation
            self.fullName.subscribe(function (newValue) {
                self.validateFullName(newValue);
            });
            self.email.subscribe(function (newValue) {
                self.validateEmail(newValue);
            });
            self.phoneNumber.subscribe(function (newValue) {
                self.validatePhoneNumber(newValue);
            });
            self.password.subscribe(function (newValue) {
                self.validatePassword(newValue);
            });
            self.address.subscribe(function (newValue) {
                self.validateAddress(newValue);
            });

            /**
             * Validates full name on blur event.
             */
            self.onFullNameBlur = function () {
                self.validateFullName(self.fullName());
            };

            /**
             * Validates email on blur event.
             */
            self.onEmailBlur = function () {
                self.validateEmail(self.email());
            };

            /**
             * Validates phone number on blur event.
             */
            self.onPhoneNumberBlur = function () {
                self.validatePhoneNumber(self.phoneNumber());
            };

            /**
             * Validates password on blur event.
             */
            self.onPasswordBlur = function () {
                self.validatePassword(self.password());
            };

            /**
             * Validates address on blur event.
             */
            self.onAddressBlur = function () {
                self.validateAddress(self.address());
            };

            /**
             * Handles the sign-up process by validating inputs and making an API call.
             * Redirects to sign-in page on success, shows error message on failure.
             */
            self.signUp = async function () {
                var fields = {
                    fullName: self.fullName() ? self.fullName().trim() : "",
                    email: self.email() ? self.email().trim() : "",
                    phoneNumber: self.phoneNumber() ? self.phoneNumber().trim() : "",
                    dateOfBirth: self.dateOfBirth(),
                    password: self.password() ? self.password().trim() : "",
                    address: self.address() ? self.address().trim() : ""
                };
                var isFullNameValid = self.validateFullName(fields.fullName);
                var isEmailValid = self.validateEmail(fields.email);
                var isPhoneNumberValid = self.validatePhoneNumber(fields.phoneNumber);
                var isPasswordValid = self.validatePassword(fields.password);
                var isAddressValid = self.validateAddress(fields.address);
                if (!(isFullNameValid && isEmailValid && isPhoneNumberValid && isPasswordValid && isAddressValid)) {
                    return;
                }
                try {
                    self.showLoading(true);
                    const response = await fetch(`${self.API_BASE.USER}/users/signup`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(fields)
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
                        throw new Error(errorMessage);
                    }
                    await response.json();
                    self.showMessage('Account created successfully! Please sign in.', 'success');
                    CoreRouter.rootInstance.go({ path: "signin" });
                } catch (error) {
                    self.showMessage(error.message || 'Error creating account. Please try again.', 'error');
                } finally {
                    self.showLoading(false);
                }
            };

            /**
             * Navigates to the Sign In page.
             */
            self.showSignIn = function () {
                CoreRouter.rootInstance.go({ path: "signin" });
            };
        }
        return SignUpViewModel;
    });