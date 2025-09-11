/*
    Document   : TransferViewModel
    Created on : Sep 9, 2025
    Author     : Jayatheerth P Z
    Description:
        Manages the process of transferring money between accounts with form validation and API interaction.
*/

define([
    "knockout",
    "ojs/ojarraydataprovider",
    "ojs/ojcorerouter",
    "oj-c/input-text",
    "oj-c/input-number",
    "oj-c/text-area",
    "oj-c/select-single",
    "oj-c/button",
    "oj-c/form-layout",
],
    function (ko, ArrayDataProvider, CoreRouter) {
        /**
         * ViewModel for the Transfer page.
         * Manages the process of transferring money between accounts with form validation and API interaction.
         */
        function TransferViewModel() {
            var self = this;
            // Observables for form fields
            self.fromAccount = ko.observable("");
            self.toAccount = ko.observable("");
            self.amount = ko.observable(null);
            self.branch = ko.observable("");
            self.description = ko.observable("");
            // Observables for accounts dropdown
            self.accounts = ko.observableArray([]);
            self.accountsDataProvider = ko.observable();
            // Observables for validation errors
            self.fromAccountError = ko.observableArray([]);
            self.toAccountError = ko.observableArray([]);
            self.amountError = ko.observableArray([]);
            self.branchError = ko.observableArray([]);
            self.descriptionError = ko.observableArray([]);
            // Observable for loading state
            self.isLoading = ko.observable(false);
            self.API_BASE = {
                ACCOUNT: 'http://localhost:8085/accountservice/api/v1',
                TRANSACTION: 'http://localhost:8085/transactionservice/api/v1'
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
                        accountNumber: acc.accountNumber,
                        label: `${acc.accountNumber} (${acc.accountType})`
                    }));
                    self.accounts(accountList);
                    self.accountsDataProvider(new ArrayDataProvider(self.accounts(), { keyAttributes: 'accountNumber' }));
                } catch (error) {
                    self.showMessage(error.message || 'Error loading accounts. Please try again.', 'error');
                } finally {
                    self.showLoading(false);
                }
            };

            /**
             * Validates the source account selection.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateFromAccount = function () {
                self.fromAccountError([]);
                var value = self.fromAccount();
                if (!value) {
                    self.fromAccountError.push({ summary: "From Account Required", detail: "Please select a source account." });
                    return false;
                }
                return true;
            };

            /**
             * Validates the destination account input.
             * @param {string} toAccount - The destination account number to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateToAccount = function (toAccount) {
                self.toAccountError([]);
                var trimmedToAccount = toAccount ? toAccount.trim() : "";
                if (!trimmedToAccount) {
                    self.toAccountError.push({ summary: "To Account Required", detail: "Please enter a destination account number." });
                    return false;
                }
                if (trimmedToAccount.length < 5) {
                    self.toAccountError.push({ summary: "Invalid Account Number", detail: "Account number must be at least 5 digits long." });
                    return false;
                }
                return true;
            };

            /**
             * Validates the transfer amount.
             * @param {number|null} amount - The amount to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateAmount = function (amount) {
                self.amountError([]);
                if (amount === null || amount === undefined) {
                    self.amountError.push({ summary: "Amount Required", detail: "Please enter an amount to transfer." });
                    return false;
                }
                if (amount < 1) {
                    self.amountError.push({ summary: "Amount Too Low", detail: "Transfer amount must be at least 1." });
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
             * Validates the transfer description.
             * @param {string} description - The description to validate.
             * @returns {boolean} True if valid, false otherwise.
             */
            self.validateDescription = function (description) {
                self.descriptionError([]);
                var trimmedDescription = description ? description.trim() : "";
                if (!trimmedDescription) {
                    self.descriptionError.push({ summary: "Description Required", detail: "Please enter a transfer description." });
                    return false;
                }
                if (trimmedDescription.length < 5) {
                    self.descriptionError.push({ summary: "Description Too Short", detail: "Description must be at least 5 characters long after trimming." });
                    return false;
                }
                return true;
            };

            // Subscribe to input changes for real-time validation
            self.fromAccount.subscribe(function (newValue) {
                self.validateFromAccount();
            });
            self.toAccount.subscribe(function (newValue) {
                self.validateToAccount(newValue);
            });
            self.amount.subscribe(function (newValue) {
                self.validateAmount(newValue);
            });
            self.branch.subscribe(function (newValue) {
                self.validateBranch(newValue);
            });
            self.description.subscribe(function (newValue) {
                self.validateDescription(newValue);
            });

            /**
             * Validates destination account on blur event.
             */
            self.onToAccountBlur = function () {
                self.validateToAccount(self.toAccount());
            };

            /**
             * Validates amount on blur event.
             */
            self.onAmountBlur = function () {
                self.validateAmount(self.amount());
            };

            /**
             * Validates branch on blur event.
             */
            self.onBranchBlur = function () {
                self.validateBranch(self.branch());
            };

            /**
             * Validates description on blur event.
             */
            self.onDescriptionBlur = function () {
                self.validateDescription(self.description());
            };

            /**
             * Handles the money transfer process by validating inputs and making an API call.
             * Redirects to dashboard on success, shows error message on failure.
             */
            self.transferMoney = async function () {
                var fromAccountNumber = self.fromAccount();
                var toAccountNumber = self.toAccount() ? self.toAccount().trim() : "";
                var amount = self.amount();
                var branch = self.branch() ? self.branch().trim() : "";
                var description = self.description() ? self.description().trim() : "";
                var isFromAccountValid = self.validateFromAccount();
                var isToAccountValid = self.validateToAccount(toAccountNumber);
                var isAmountValid = self.validateAmount(amount);
                var isBranchValid = self.validateBranch(branch);
                var isDescriptionValid = self.validateDescription(description);
                if (!(isFromAccountValid && isToAccountValid && isAmountValid && isBranchValid && isDescriptionValid)) {
                    return;
                }
                try {
                    self.showLoading(true);
                    const response = await fetch(`${self.API_BASE.TRANSACTION}/transactions/transact`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...self.getAuthHeaders()
                        },
                        body: JSON.stringify({
                            transactionType: 'TRANSFER',
                            fromAccountNumber: fromAccountNumber,
                            toAccountNumber: toAccountNumber,
                            amount: parseFloat(amount),
                            description: description,
                            branch: branch
                        })
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
                        throw new Error(errorMessage);
                    }
                    await response.json();
                    self.showMessage('Transfer completed successfully!', 'success');
                    self.fromAccount("");
                    self.toAccount("");
                    self.amount(null);
                    self.branch("");
                    self.description("");
                    CoreRouter.rootInstance.go({ path: "dashboard" });
                } catch (error) {
                    self.showMessage(error.message || 'Transfer failed. Please try again.', 'error');
                } finally {
                    self.showLoading(false);
                }
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
        return TransferViewModel;
    });