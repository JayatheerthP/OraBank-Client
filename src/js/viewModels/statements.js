define([
    "knockout",
    "ojs/ojarraydataprovider",
    "ojs/ojcorerouter",
    "oj-c/select-single",
    "ojs/ojtable",
    "oj-c/progress-circle"
],
    function (ko, ArrayDataProvider, CoreRouter) {
        function StatementsViewModel() {
            var self = this;
            // Observables for data
            self.accounts = ko.observableArray([]);
            self.accountsDataProvider = ko.observable();
            self.selectedAccount = ko.observable("");
            self.statements = ko.observableArray([]);
            self.statementsDataProvider = ko.observable();
            self.statementsVisible = ko.observable(false);
            // Observable for loading state
            self.isLoading = ko.observable(false);
            self.API_BASE = {
                ACCOUNT: 'http://localhost:8085/accountservice/api/v1',
                TRANSACTION: 'http://localhost:8085/transactionservice/api/v1'
            };

            // Table columns definition for statements
            self.columns = [
                { headerText: 'Date', field: 'date' },
                { headerText: 'Description', field: 'description' },
                { headerText: 'Type', field: 'transactionType' },
                { headerText: 'Amount', field: 'amount' },
                { headerText: 'Other Party', field: 'otherParty' },
                { headerText: 'Status', field: 'status' }
            ];

            // Utility to show loading state
            self.showLoading = function (show) {
                self.isLoading(show);
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

            // Fetch user accounts from API for dropdown
            self.loadUserAccounts = async function () {
                var authToken = sessionStorage.getItem('authToken');
                if (!authToken) {
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
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
                        throw new Error(errorMessage);
                    }
                    const data = await response.json();
                    var accountList = (data.accounts || []).map(acc => ({
                        value: acc.accountNumber,
                        label: `${acc.accountNumber} (${acc.accountType})`
                    }));
                    self.accounts(accountList);
                    self.accountsDataProvider(new ArrayDataProvider(self.accounts(), { keyAttributes: 'value' }));
                } catch (error) {
                    self.showMessage(error.message || 'Error loading accounts. Please try again.', 'error');
                    console.error(error);
                } finally {
                    self.showLoading(false);
                }
            };

            // Fetch statements for the selected account
            self.loadStatements = async function (accountNumber) {
                if (!accountNumber) {
                    self.statementsVisible(false);
                    self.statements([]);
                    return;
                }
                try {
                    self.showLoading(true);
                    const response = await fetch(`${self.API_BASE.TRANSACTION}/transactions/${accountNumber}/statement`, {
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
                    self.statements(data.transactions || []);
                    self.statementsDataProvider(new ArrayDataProvider(self.statements(), { keyAttributes: 'id' }));
                    self.statementsVisible(true);
                } catch (error) {
                    self.showMessage(error.message || 'Error loading statements. Please try again.', 'error');
                    console.error(error);
                    self.statementsVisible(false);
                } finally {
                    self.showLoading(false);
                }
            };

            // Event handler for account selection change
            self.onAccountSelected = function (event) {
                var selectedValue = event.detail.value;
                self.selectedAccount(selectedValue);
                self.loadStatements(selectedValue);
            };

            // Initialize the component (load accounts on load)
            self.initialize = function () {
                self.loadUserAccounts();
            };

            // Call initialize when the component is loaded
            self.initialize();
        }
        return StatementsViewModel;
    });