define([
  "knockout",
  "oj-c/button",
  "oj-c/form-layout"
],
  function (ko, Button, FormLayout) {
    function DashboardViewModel() {
      var self = this;
      // Observables for account data
      self.accounts = ko.observableArray([]);
      self.API_BASE = {
        ACCOUNT: 'http://localhost:8085/accountservice/api/v1'
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

      // Function to render account cards manually
      self.renderAccountCards = function (accounts) {
        var container = document.getElementById('accountCards');
        if (!container) {
          console.error("Account cards container not found.");
          return;
        }
        container.innerHTML = ''; // Clear existing content

        if (accounts.length === 0) {
          var noAccountsDiv = document.createElement('div');
          noAccountsDiv.innerHTML = '<p>No accounts found. Please create an account.</p>';
          container.appendChild(noAccountsDiv);
          return;
        }

        accounts.forEach(function (account) {
          var cardDiv = document.createElement('div');
          cardDiv.innerHTML = `
                    <div>
                        <h3>${account.accountType || 'N/A'}</h3>
                        <p>${account.accountNumber || 'N/A'}</p>
                    </div>
                    <span>${account.isActive ? 'Active' : 'Inactive'}</span>
                    <div>
                        ₹<span>${account.balance ? account.balance.toLocaleString() : '0.00'}</span>
                    </div>
                `;
          container.appendChild(cardDiv);
        });
      };

      // Fetch user accounts from API
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
          var fetchedAccounts = data.accounts || [];
          self.accounts(fetchedAccounts);
          // Render account cards manually
          self.renderAccountCards(fetchedAccounts);
        } catch (error) {
          self.showMessage('Error loading accounts. Please try again.', 'error');
          console.error(error);
        } finally {
          self.showLoading(false);
        }
      };

      // Quick action navigation functions (placeholders)
      self.showTransferView = function () {
        console.log("Navigating to Transfer Money view...");
        // Placeholder for navigation to transfer view
        // Example: window.location.href = 'transfer.html';
        self.showMessage('Navigating to Transfer Money', 'info');
      };

      self.showStatementView = function () {
        console.log("Navigating to Statements view...");
        // Placeholder for navigation to statement view
        // Example: window.location.href = 'statement.html';
        self.showMessage('Navigating to Statements', 'info');
      };

      self.showCreateAccountView = function () {
        console.log("Navigating to Create Account view...");
        // Placeholder for navigation to create account view
        // Example: window.location.href = 'createaccount.html';
        self.showMessage('Navigating to Create Account', 'info');
      };

      // Initialize the component (load data on load)
      self.initialize = function () {
        self.loadUserAccounts();
      };

      // Call initialize when the component is loaded
      self.initialize();
    }
    return DashboardViewModel;
  });