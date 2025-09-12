/*
    Document   : MyAccountsViewModel
    Created on : Sep 9, 2025
    Author     : Jayatheerth P Z
    Description:
        Manages the display of user accounts and provides functionality to download account statements.
*/

define([
    "knockout",
    "oj-c/button",
    "ojs/ojtable",
    "ojs/ojarraydataprovider",
    "ojs/ojcorerouter",
    "jspdf"
],
    function (ko, Button, ojtable, ArrayDataProvider, CoreRouter, jspdf) {
        /**
         * ViewModel for the My Accounts page.
         * Manages the display of user accounts and provides functionality to download account statements.
         */
        function MyAccountsViewModel() {
            var self = this;
            // Observables for account data
            self.accounts = ko.observableArray([]);
            self.accountsDataProvider = ko.observable();
            // Observable for loading state
            self.isLoading = ko.observable(false);
            self.API_BASE = {
                ACCOUNT: 'http://localhost:8085/accountservice/api/v1',
                TRANSACTION: 'http://localhost:8085/transactionservice/api/v1'
            };
            // Table columns definition
            self.columns = [
                { headerText: 'Account Number', field: 'accountNumber' },
                { headerText: 'Type', field: 'accountType' },
                { headerText: 'Balance', field: 'balance' },
                { headerText: 'Status', field: 'isActive' },
                { headerText: 'Actions', field: 'actions' }
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
             * Fetches user accounts from the API and updates the table data provider.
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
                    self.accounts(data.accounts || []);
                    self.accountsDataProvider(new ArrayDataProvider(self.accounts(), { keyAttributes: 'accountNumber' }));
                } catch (error) {
                    self.showMessage(error.message || 'Error loading accounts. Please try again.', 'error');
                } finally {
                    self.showLoading(false);
                }
            };

            /**
             * Downloads an account statement as a PDF for the specified account number.
             * @param {string} accountNumber - The account number for which to download the statement.
             */
            self.downloadAccountStatement = async function (accountNumber) {
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
                    const transactions = data.transactions || [];
                    const { jsPDF } = jspdf;
                    const doc = new jsPDF();
                    doc.setFontSize(18);
                    doc.text('Account Statement', 14, 20);
                    doc.setFontSize(12);
                    doc.text(`Account Number: ${accountNumber}`, 14, 30);
                    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
                    let yPosition = 50;
                    if (transactions.length === 0) {
                        doc.text('No transactions found for this account.', 14, yPosition);
                    } else {
                        transactions.forEach((tx, index) => {
                            doc.setFontSize(14);
                            doc.text(`---------------------------------------------------------------------------------------------`, 14, yPosition);
                            yPosition += 6;
                            doc.setFontSize(12);
                            doc.text(`Date: ${tx.date || 'N/A'}`, 14, yPosition);
                            yPosition += 6;
                            doc.text(`Description: ${tx.description || 'N/A'}`, 14, yPosition);
                            yPosition += 6;
                            doc.text(`Type: ${tx.transactionType || 'N/A'}`, 14, yPosition);
                            yPosition += 6;
                            doc.text(`Amount: Rs.${tx.amount ? tx.amount : '0.00'}`, 14, yPosition);
                            yPosition += 6;
                            doc.text(`Status: ${tx.status || 'N/A'}`, 14, yPosition);
                            yPosition += 10;
                            if (yPosition > 260) {
                                doc.addPage();
                                yPosition = 20;
                            }
                        });
                    }
                    doc.save(`Account_Statement_${accountNumber}.pdf`);
                } catch (error) {
                    self.showMessage(error.message || 'Error downloading statement. Please try again.', 'error');
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
        return MyAccountsViewModel;
    });