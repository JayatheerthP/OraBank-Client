define([
    "knockout",
    "oj-c/input-text",
    "oj-c/text-area",
    "oj-c/input-date-picker",
    "oj-c/form-layout"
],
    function (ko, InputText, TextArea, InputDatePicker, FormLayout) {
        function ProfileViewModel() {
            var self = this;
            // Observables for profile data
            self.fullName = ko.observable("");
            self.email = ko.observable("");
            self.phoneNumber = ko.observable("");
            self.dateOfBirth = ko.observable();
            self.address = ko.observable("");
            self.API_BASE = {
                USER: 'http://localhost:8085/userservice/api/v1'
            };

            // Utility to show loading state (placeholder)
            self.showLoading = function (show) {
                console.log(show ? "Loading..." : "Loading complete");
            };

            // Utility to show messages (temporary placeholder for UI feedback)
            self.showMessage = function (msg, type) {
                console.log(type + ": " + msg);
                alert(type === 'success' ? 'Success: ' + msg : 'Error: ' + msg);
            };

            // Utility to get auth headers
            self.getAuthHeaders = function () {
                var authToken = sessionStorage.getItem('authToken');
                return authToken ? { 'Authorization': 'Bearer ' + authToken } : {};
            };

            // Fetch user profile data from API
            self.loadUserProfile = async function () {
                var userId = sessionStorage.getItem('userId');
                if (!userId) {
                    self.showMessage('User ID not found. Please log in again.', 'error');
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
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const data = await response.json();
                    // Update observables with profile data
                    self.fullName(data.fullName || "");
                    self.email(data.email || "");
                    self.phoneNumber(data.phoneNumber || "");
                    self.dateOfBirth(data.dateOfBirth || "");
                    self.address(data.address || "");
                } catch (error) {
                    self.showMessage('Error loading profile. Please try again.', 'error');
                    console.error(error);
                } finally {
                    self.showLoading(false);
                }
            };

            // Initialize the component (load profile data on load)
            self.initialize = function () {
                self.loadUserProfile();
            };

            // Call initialize when the component is loaded
            self.initialize();
        }
        return ProfileViewModel;
    });