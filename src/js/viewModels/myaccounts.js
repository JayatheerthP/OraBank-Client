define([
    "knockout",
    "oj-c/button",
    "ojs/ojtable",
    "ojs/ojarraydataprovider",
    "ojs/ojcorerouter",
    "jspdf"
],
    function (ko, Button, ojtable, ArrayDataProvider, CoreRouter, jspdf) {
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

            // Fetch user accounts from API
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
                    console.error(error);
                } finally {
                    self.showLoading(false);
                }
            };

            // Function to download account statement as PDF with improved table styling
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

                    // Generate PDF using jsPDF
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
                            yPosition += 10; // Extra spacing between transactions

                            if (yPosition > 260) { // Add new page if content exceeds page height
                                doc.addPage();
                                yPosition = 20;
                            }
                        });
                    }

                    // Save the PDF
                    doc.save(`Account_Statement_${accountNumber}.pdf`);
                    self.showMessage('Statement downloaded successfully!', 'success');
                } catch (error) {
                    self.showMessage(error.message || 'Error downloading statement. Please try again.', 'error');
                    console.error(error);
                } finally {
                    self.showLoading(false);
                }
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