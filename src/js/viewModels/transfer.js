define([
    "knockout",
    "oj-c/input-text",
    "oj-c/input-number",
    "oj-c/text-area",
    "oj-c/select-single",
    "oj-c/button",
    "oj-c/form-layout",
    "ojs/ojarraydataprovider"
],
    function (ko, InputText, InputNumber, TextArea, SelectSingle, Button, FormLayout, ArrayDataProvider) {
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
            self.API_BASE = {
                ACCOUNT: 'http://localhost:8085/accountservice/api/v1',
                TRANSACTION: 'http://localhost:8085/transactionservice/api/v1'
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

            // Fetch user accounts for dropdown
            self.loadUserAccounts = async function () {
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
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const data = await response.json();
                    // Assuming data.accounts is the array of accounts
                    self.accounts(data.accounts || []);
                    // Update data provider for oj-c-select-single
                    self.accountsDataProvider(new ArrayDataProvider(self.accounts(), { keyAttributes: 'accountNumber' }));
                } catch (error) {
                    self.showMessage('Error loading accounts. Please try again.', 'error');
                    console.error(error);
                } finally {
                    self.showLoading(false);
                }
            };

            // Validation Functions
            self.validateFromAccount = function (event) {
                self.fromAccountError([]);
                var value = self.fromAccount();
                if (!value) {
                    self.fromAccountError.push({ summary: "From Account Required", detail: "Please select a source account." });
                    return false;
                }
                return true;
            };

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

            // Real-time validation as user types or selects
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

            // Validation on blur (optional, as real-time is covered by subscribe)
            self.onToAccountBlur = function () {
                self.validateToAccount(self.toAccount());
            };
            self.onAmountBlur = function () {
                self.validateAmount(self.amount());
            };
            self.onBranchBlur = function () {
                self.validateBranch(self.branch());
            };
            self.onDescriptionBlur = function () {
                self.validateDescription(self.description());
            };

            // Transfer Money function with validation
            self.transferMoney = async function () {
                var fromAccountNumber = self.fromAccount();
                var toAccountNumber = self.toAccount() ? self.toAccount().trim() : "";
                var amount = self.amount();
                var branch = self.branch() ? self.branch().trim() : "";
                var description = self.description() ? self.description().trim() : "";

                // Validate all fields before submission
                var isFromAccountValid = self.validateFromAccount();
                var isToAccountValid = self.validateToAccount(toAccountNumber);
                var isAmountValid = self.validateAmount(amount);
                var isBranchValid = self.validateBranch(branch);
                var isDescriptionValid = self.validateDescription(description);

                if (!(isFromAccountValid && isToAccountValid && isAmountValid && isBranchValid && isDescriptionValid)) {
                    self.showMessage('Please correct the errors before transferring money.', 'error');
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
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    await response.json();
                    self.showMessage('Transfer completed successfully!', 'success');
                    // Reset form fields
                    self.fromAccount("");
                    self.toAccount("");
                    self.amount(null);
                    self.branch("");
                    self.description("");
                    // Placeholder for navigation or refresh (e.g., to Dashboard)
                    console.log("Navigating to Dashboard...");
                    // Example: window.location.href = 'dashboard.html';
                } catch (error) {
                    self.showMessage('Transfer failed. Please try again.', 'error');
                    console.error(error);
                } finally {
                    self.showLoading(false);
                }
            };

            // Initialize the component (load accounts on load)
            self.initialize = function () {
                self.loadUserAccounts();
            };

            // Call initialize when the component is loaded
            self.initialize();
        }
        return TransferViewModel;
    });