/*
    Document   : CreateAccountViewModel
    Created on : Sep 9, 2025
    Author     : Jayatheerth P Z
    Description:
        Handles the creation of a new bank account with form validation and API interaction.
*/

define([
    "knockout",
    "ojs/ojarraydataprovider",
    "ojs/ojcorerouter",
    "oj-c/input-text",
    "oj-c/input-number",
    "oj-c/select-single",
    "oj-c/button",
    "oj-c/form-layout",
    "oj-c/progress-circle"
],
    function (ko, ArrayDataProvider, CoreRouter) {
        /**
         * ViewModel for the Create Account page.
         * Handles the creation of a new bank account with form validation and API interaction.
         */
        function CreateAccountViewModel() {
            var self = this;
            // Observables for form fields
            self.accountType = ko.observable("");
            self.currency = ko.observable("INR");
            self.branch = ko.observable("");
            self.initialDeposit = ko.observable(null);
            // Observables for validation errors
            self.accountTypeError = ko.observableArray([]);
            self.currencyError = ko.observableArray([]);
            self.branchError = ko.observableArray([]);
            self.initialDepositError = ko.observableArray([]);
            // Observable for loading state
            self.isLoading = ko.observable(false);
            self.API_BASE = {
                ACCOUNT: 'http://localhost:8085/accountservice/api/v1'
            };
            // Data for dropdowns
            self.accountTypes = [
                { value: "SAVINGS", label: "Savings Account" },
                { value: "SALARY", label: "Salary Account" },
                { value: "FD", label: "Fixed Deposit" },
                { value: "RD", label: "Recurring Deposit" }
            ];
            self.currencies = [
                { value: "INR", label: "INR - Indian Rupee" },
                { value: "USD", label: "USD - US Dollar" },
                { value: "EUR", label: "EUR - Euro" }
            ];
            // Data providers for dropdowns
            self.accountTypesDataProvider = new ArrayDataProvider(self.accountTypes, { keyAttributes: 'value' });
            self.currenciesDataProvider = new ArrayDataProvider(self.currencies, { keyAttributes: 'value' });

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
             * Validates the account type selection.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateAccountType = function () {
                self.accountTypeError([]);
                var value = self.accountType();
                if (!value) {
                    self.accountTypeError.push({ summary: "Account Type Required", detail: "Please select an account type." });
                    return false;
                }
                return true;
            };

            /**
             * Validates the currency selection.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateCurrency = function () {
                self.currencyError([]);
                var value = self.currency();
                if (!value) {
                    self.currencyError.push({ summary: "Currency Required", detail: "Please select a currency." });
                    return false;
                }
                return true;
            };

            /**
             * Validates the branch input.
             * @param {string} branch - The branch name to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateBranch = function (branch) {
                self.branchError([]);
                var trimmedBranch = branch ? branch.trim() : "";
                if (!trimmedBranch) {
                    self.branchError.push({ summary: "Branch Required", detail: "Please enter a branch name." });
                    return false;
                }
                if (trimmedBranch.length < 3) {
                    self.branchError.push({ summary: "Branch Name Too Short", detail: "Branch name must be at least 3 characters long after trimming." });
                    return false;
                }
                return true;
            };

            /**
             * Validates the initial deposit amount.
             * @param {number|null} initialDeposit - The initial deposit amount to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateInitialDeposit = function (initialDeposit) {
                self.initialDepositError([]);
                if (initialDeposit === null || initialDeposit === undefined) {
                    self.initialDepositError.push({ summary: "Initial Deposit Required", detail: "Please enter an initial deposit amount." });
                    return false;
                }
                if (initialDeposit < 1000) {
                    self.initialDepositError.push({ summary: "Initial Deposit Too Low", detail: "Initial deposit must be at least 1000." });
                    return false;
                }
                return true;
            };

            // Subscribe to input changes for real-time validation
            self.accountType.subscribe(function (newValue) {
                self.validateAccountType();
            });
            self.currency.subscribe(function (newValue) {
                self.validateCurrency();
            });
            self.branch.subscribe(function (newValue) {
                self.validateBranch(newValue);
            });
            self.initialDeposit.subscribe(function (newValue) {
                self.validateInitialDeposit(newValue);
            });

            /**
             * Validates branch on blur event.
             */
            self.onBranchBlur = function () {
                self.validateBranch(self.branch());
            };

            /**
             * Validates initial deposit on blur event.
             */
            self.onInitialDepositBlur = function () {
                self.validateInitialDeposit(self.initialDeposit());
            };

            /**
             * Handles the account creation process by validating inputs and making an API call.
             * Redirects to dashboard on success, shows error message on failure.
             */
            self.createAccount = async function () {
                var authToken = sessionStorage.getItem('authToken');
                if (!authToken) {
                    CoreRouter.rootInstance.go({ path: "signin" });
                    return;
                }
                var accountType = self.accountType();
                var currency = self.currency();
                var branch = self.branch() ? self.branch().trim() : "";
                var initialDeposit = self.initialDeposit();
                var isAccountTypeValid = self.validateAccountType();
                var isCurrencyValid = self.validateCurrency();
                var isBranchValid = self.validateBranch(branch);
                var isInitialDepositValid = self.validateInitialDeposit(initialDeposit);
                if (!(isAccountTypeValid && isCurrencyValid && isBranchValid && isInitialDepositValid)) {
                    return;
                }
                try {
                    self.showLoading(true);
                    const response = await fetch(`${self.API_BASE.ACCOUNT}/accounts/createaccount`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...self.getAuthHeaders()
                        },
                        body: JSON.stringify({
                            accountType: accountType,
                            currency: currency,
                            branch: branch,
                            initialDeposit: parseFloat(initialDeposit)
                        })
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
                        throw new Error(errorMessage);
                    }
                    await response.json();
                    self.showMessage('Account created successfully!', 'success');
                    self.accountType("");
                    self.currency("INR");
                    self.branch("");
                    self.initialDeposit(null);
                    CoreRouter.rootInstance.go({ path: "dashboard" });
                } catch (error) {
                    self.showMessage(error.message || 'Error creating account. Please try again.', 'error');
                } finally {
                    self.showLoading(false);
                }
            };

            /**
             * Initializes the component.
             */
            self.initialize = function () {
                // Placeholder for initialization logic if needed
            };

            // Call initialize when the component is loaded
            self.initialize();
        }
        return CreateAccountViewModel;
    });