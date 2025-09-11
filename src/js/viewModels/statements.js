/*
    Document   : StatementsViewModel
    Created on : Sep 9, 2025
    Author     : Jayatheerth P Z
    Description:
        Manages the display of account statements based on selected user accounts.
*/

define([
    "knockout",
    "ojs/ojarraydataprovider",
    "ojs/ojcorerouter",
    "oj-c/select-single",
    "ojs/ojtable",
    "oj-c/progress-circle"
],
    function (ko, ArrayDataProvider, CoreRouter) {
        /**
         * ViewModel for the Statements page.
         * Manages the display of account statements based on selected user accounts.
         */
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
             * Fetches user accounts from the API for the dropdown selection.
             */
            self.loadUserAccounts = async function () {
                var authToken = sessionStorage.getItem('authToken');
                if (!authToken) {
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
                } finally {
                    self.showLoading(false);
                }
            };

            /**
             * Fetches transaction statements for the selected account from the API.
             * @param {string} accountNumber - The account number for which to load statements.
             */
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
                    self.statementsVisible(false);
                } finally {
                    self.showLoading(false);
                }
            };

            /**
             * Handles the account selection change event and loads statements for the selected account.
             * @param {Object} event - The event object containing the selected value.
             */
            self.onAccountSelected = function (event) {
                var selectedValue = event.detail.value;
                self.selectedAccount(selectedValue);
                self.loadStatements(selectedValue);
            };

            /**
             * Initializes the component by loading account data.
             */
            self.initialize = function () {
                self.loadUserAccounts();
            };

            // Call initialize when the component is loaded
            self.initialize();
        }
        return StatementsViewModel;
    });