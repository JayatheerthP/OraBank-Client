define([
    "knockout",
    "oj-c/button",
    "ojs/ojtable",
    "ojs/ojarraydataprovider",
    "ojs/ojcorerouter" // Add CoreRouter for navigation
],
    function (ko, Button, ojtable, ArrayDataProvider, CoreRouter) {
        function MyAccountsViewModel() {
            var self = this;
            // Observables for account data
            self.accounts = ko.observableArray([]);
            self.accountsDataProvider = ko.observable();
            self.API_BASE = {
                ACCOUNT: 'http://localhost:8085/accountservice/api/v1'
            };
            // Table columns definition
            self.columns = [
                { headerText: 'Account Number', field: 'accountNumber' },
                { headerText: 'Type', field: 'accountType' },
                { headerText: 'Balance', field: 'balance' },
                { headerText: 'Status', field: 'isActive' }
            ];
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
            // Fetch user accounts from API
            self.loadUserAccounts = async function () {
                var authToken = sessionStorage.getItem('authToken');
                if (!authToken) {
                    self.showMessage('Authentication token not found. Please log in again.', 'error');
                    // Navigate to sign-in page if token is not found
                    CoreRouter.rootInstance.go({ path: "signin" });
                    return;
                }
                try {
                    self.showLoading(true);
                    const response = await fetch(`${self.API_BASE.ACCOUNT}/accounts/user`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...self.getAuthHeaders()
                        }
                    });
                    if (!response.ok) {
                        // Attempt to parse error response body
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
                        throw new Error(errorMessage);
                    }
                    const data = await response.json();
                    // Assuming data.accounts is the array of accounts
                    self.accounts(data.accounts || []);
                    // Update data provider for oj-table
                    self.accountsDataProvider(new ArrayDataProvider(self.accounts(), { keyAttributes: 'accountNumber' }));
                } catch (error) {
                    self.showMessage(error.message || 'Error loading accounts. Please try again.', 'error');
                    console.error(error);
                } finally {
                    self.showLoading(false);
                }
            };
            // Function to view account statement (navigation using CoreRouter)
            self.viewStatement = function (accountNumber) {
                console.log("Viewing statement for account: " + accountNumber);
                // Navigate to statement view with account number as a parameter
                CoreRouter.rootInstance.go({ path: "statement", params: { accountNumber: accountNumber } });
            };
            // Initialize the component (load data on load)
            self.initialize = function () {
                self.loadUserAccounts();
            };
            // Call initialize when the component is loaded
            self.initialize();
        }
        return MyAccountsViewModel;
    });