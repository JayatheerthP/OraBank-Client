define([
  "knockout",
  "ojs/ojcorerouter",
  "oj-c/button",
  "oj-c/form-layout",
  "oj-c/progress-circle"
],
  function (ko, CoreRouter) {
    function DashboardViewModel() {
      var self = this;
      // Observables for account data
      self.accounts = ko.observableArray([]);
      // Observable for loading state
      self.isLoading = ko.observable(false);
      self.API_BASE = {
        ACCOUNT: 'http://localhost:8085/accountservice/api/v1'
      };

      // Utility to show loading state
      self.showLoading = function (show) {
        self.isLoading(show);
        console.log(show ? "Loading..." : "Loading complete");
      };

      // Utility to show messages (temporary placeholder for UI feedback)
      self.showMessage = function (msg, type) {
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
          cardDiv.className = 'account-card'; // Optional: Add a class for styling
          cardDiv.innerHTML = `
          <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-600 hover:shadow-xl transition-shadow">
            <div class="flex justify-between items-start mb-4">
              <div class="flex flex-col gap-1 flex-wrap">
                <span class="text-xl font-bold text-gray-800">${account.accountType || 'N/A'} Account</span>
                <span class="text-gray-600">${account.branch}</span>
              </div>
              <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                ${account.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Account Number:</span>
                <span class="font-semibold text-gray-800">${account.accountNumber || 'N/A'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Branch:</span>
                <span class="font-semibold text-gray-800">${account.branch || 'N/A'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Balance:</span>
                <span class="font-bold text-green-600 text-xl">₹${account.balance ? account.balance.toLocaleString() : '0.00'}</span>
              </div>
            </div>         
          </div>
          `;
          container.appendChild(cardDiv);
        });
      };

      // Fetch user accounts from API
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
          var fetchedAccounts = data.accounts || [];
          self.accounts(fetchedAccounts);
          self.renderAccountCards(fetchedAccounts);
        } catch (error) {
          self.showMessage(error.message || 'Error loading accounts. Please try again.', 'error');
          console.error(error);
        } finally {
          self.showLoading(false);
        }
      };

      // Quick action navigation functions using CoreRouter
      self.showTransferView = function () {
        CoreRouter.rootInstance.go({ path: "transfer" });
      };
      self.showStatementView = function () {
        CoreRouter.rootInstance.go({ path: "statements" });
      };
      self.showCreateAccountView = function () {
        console.log("Navigating to Create Account view...");
        CoreRouter.rootInstance.go({ path: "createaccount" });
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