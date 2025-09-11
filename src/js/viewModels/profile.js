/*
    Document   : ProfileViewModel
    Created on : Sep 9, 2025
    Author     : Jayatheerth P Z
    Description:
        Manages the display of user profile information retrieved from an API.
*/

define([
    "knockout",
    "ojs/ojcorerouter",
    "oj-c/input-text",
    "oj-c/text-area",
    "oj-c/input-date-picker",
    "oj-c/form-layout",
    "oj-c/progress-circle"
],
    function (ko, CoreRouter) {
        /**
         * ViewModel for the Profile page.
         * Manages the display of user profile information retrieved from an API.
         */
        function ProfileViewModel() {
            var self = this;
            // Observables for profile data
            self.fullName = ko.observable("");
            self.email = ko.observable("");
            self.phoneNumber = ko.observable("");
            self.dateOfBirth = ko.observable();
            self.address = ko.observable("");
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
             * Retrieves authentication headers for API requests.
             * @returns {Object} Headers object with Authorization token if available.
             */
            self.getAuthHeaders = function () {
                var authToken = sessionStorage.getItem('authToken');
                return authToken ? { 'Authorization': 'Bearer ' + authToken } : {};
            };

            /**
             * Fetches user profile data from the API and updates observables.
             */
            self.loadUserProfile = async function () {
                var userId = sessionStorage.getItem('userId');
                if (!userId) {
                    CoreRouter.rootInstance.go({ path: "signin" });
                    return;
                }
                try {
                    self.showLoading(true);
                    const response = await fetch(`${self.API_BASE.USER}/users/user/${userId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...self.getAuthHeaders()
                        }
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
                        throw new Error(errorMessage);
                    }
                    const data = await response.json();
                    self.fullName(data.fullName || "");
                    self.email(data.email || "");
                    self.phoneNumber(data.phoneNumber || "");
                    self.dateOfBirth(data.dateOfBirth || "");
                    self.address(data.address || "");
                } catch (error) {
                    self.showMessage(error.message || 'Error loading profile. Please try again.', 'error');
                } finally {
                    self.showLoading(false);
                }
            };

            /**
             * Initializes the component by loading profile data.
             */
            self.initialize = function () {
                self.loadUserProfile();
            };

            // Call initialize when the component is loaded
            self.initialize();

            /**
             * Navigates to the Sign In page.
             */
            self.goToSignIn = function () {
                CoreRouter.rootInstance.go({ path: "signin" });
            };
        }
        return ProfileViewModel;
    });