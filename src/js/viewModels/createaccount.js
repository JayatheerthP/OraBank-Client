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
        function CreateAccountViewModel() {
            var self = this;
            // Observables for form fields
            self.accountType = ko.observable("");
            self.currency = ko.observable("INR"); // Default to INR
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

            // Validation Functions
            self.validateAccountType = function () {
                self.accountTypeError([]);
                var value = self.accountType();
                if (!value) {
                    self.accountTypeError.push({ summary: "Account Type Required", detail: "Please select an account type." });
                    return false;
                }
                return true;
            };

            self.validateCurrency = function () {
                self.currencyError([]);
                var value = self.currency();
                if (!value) {
                    self.currencyError.push({ summary: "Currency Required", detail: "Please select a currency." });
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

            // Real-time validation as user types or selects
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

            // Validation on blur (optional, as real-time is covered by subscribe)
            self.onBranchBlur = function () {
                self.validateBranch(self.branch());
            };
            self.onInitialDepositBlur = function () {
                self.validateInitialDeposit(self.initialDeposit());
            };

            // Create Account function with validation
            self.createAccount = async function () {
                var authToken = sessionStorage.getItem('authToken');
                if (!authToken) {
                    // Navigate to sign-in page if token is not found
                    CoreRouter.rootInstance.go({ path: "signin" });
                    return;
                }
                var accountType = self.accountType();
                var currency = self.currency();
                var branch = self.branch() ? self.branch().trim() : "";
                var initialDeposit = self.initialDeposit();
                // Validate all fields before submission
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
                    // Reset form fields
                    self.accountType("");
                    self.currency("INR");
                    self.branch("");
                    self.initialDeposit(null);
                    // Navigate to dashboard or accounts page after successful creation
                    CoreRouter.rootInstance.go({ path: "dashboard" });
                } catch (error) {
                    self.showMessage(error.message || 'Error creating account. Please try again.', 'error');
                    console.error(error);
                } finally {
                    self.showLoading(false);
                }
            };

            // Initialize the component (no API load needed on init)
            self.initialize = function () {
                // Placeholder for any initialization logic if needed
            };

            // Call initialize when the component is loaded
            self.initialize();
        }
        return CreateAccountViewModel;
    });