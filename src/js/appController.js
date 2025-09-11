/*
    Document   : ControllerViewModel
    Created on : Sep 9, 2025
    Author     : Jayatheerth P Z
    Description:
        Manages routing, navigation, authentication, and responsive layout behavior for the application.
*/

define(['knockout', 'ojs/ojcontext', 'ojs/ojmodule-element-utils', 'ojs/ojknockouttemplateutils', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojknockoutrouteradapter', 'ojs/ojurlparamadapter', 'ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils', 'ojs/ojarraydataprovider',
  'ojs/ojdrawerpopup', 'ojs/ojmodule-element', 'ojs/ojknockout'],
  function (ko, Context, moduleUtils, KnockoutTemplateUtils, CoreRouter, ModuleRouterAdapter, KnockoutRouterAdapter, UrlParamAdapter, ResponsiveUtils, ResponsiveKnockoutUtils, ArrayDataProvider) {
    /**
     * Controller ViewModel for the application.
     * Manages routing, navigation, authentication, and responsive layout behavior.
     */
    function ControllerViewModel() {
      var self = this;
      self.KnockoutTemplateUtils = KnockoutTemplateUtils;

      // Accessibility announcement handling
      self.manner = ko.observable('polite');
      self.message = ko.observable();
      announcementHandler = (event) => {
        self.message(event.detail.message);
        self.manner(event.detail.manner);
      };
      document.getElementById('globalBody').addEventListener('announce', announcementHandler, false);

      // Responsive layout setup using media queries
      const smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      self.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      const mdQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);
      self.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

      // Observable to control navbar visibility
      self.isNavbarVisible = ko.observable(true);
      self.authenticated = ko.observable(false);

      // Navigation routes configuration
      let navData = [
        { path: '', redirect: 'dashboard' },
        { path: 'dashboard', detail: { label: 'Dashboard', iconClass: 'oj-ux-ico-home' } },
        { path: 'signin', detail: { label: 'Sign In', iconClass: 'oj-ux-ico-information-s' } },
        { path: 'signup', detail: { label: 'Sign Up', iconClass: 'oj-ux-ico-information-s' } },
        { path: 'myaccounts', detail: { label: 'My Accounts', iconClass: 'oj-ux-ico-content-item-list' } },
        { path: 'statements', detail: { label: 'Statements', iconClass: 'oj-ux-ico-information-s' } },
        { path: 'createaccount', detail: { label: 'Create Account', iconClass: 'oj-ux-ico-edit-plus' } },
        { path: 'transfer', detail: { label: 'Transfer', iconClass: 'oj-ux-ico-transfer-money' } },
        { path: 'profile', detail: { label: 'Profile', iconClass: 'oj-ux-ico-user-configuration' } },
      ];

      // Router setup with URL parameter adapter
      let router = new CoreRouter(navData, {
        urlAdapter: new UrlParamAdapter()
      });
      router.sync();
      CoreRouter.rootInstance = router;
      self.moduleAdapter = new ModuleRouterAdapter(router);
      self.selection = new KnockoutRouterAdapter(router);

      // Setup navigation data provider, excluding redirected route and specific pages
      let visibleNavData = navData.slice(1).filter(route => route.path !== 'signup').filter(route => route.path !== 'signin');
      self.navDataProvider = new ArrayDataProvider(visibleNavData, { keyAttributes: "path" });

      // API base URL for user service
      self.API_BASE = {
        USER: 'http://localhost:8085/userservice/api/v1'
      };

      /**
       * Checks if the user is logged in based on the presence of an authToken in sessionStorage.
       * @returns {boolean} True if authToken exists, false otherwise.
       */
      self.isLoggedIn = function () {
        var authToken = sessionStorage.getItem('authToken');
        return !!authToken;
      };

      /**
       * Validates user authorization by checking the authToken with an API call.
       * @returns {Promise<boolean>} True if not authorized, false if authorized.
       */
      self.notAuthorized = async function () {
        var authToken = sessionStorage.getItem('authToken');
        var userId = sessionStorage.getItem('userId');
        if (!authToken || !userId) {
          this.authenticated = false;
          return true; // No token or userId means not authorized
        }
        try {
          const response = await fetch(`${self.API_BASE.USER}/users/user/${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + authToken
            }
          });
          if (!response.ok) {
            // Removed console.log for non-critical debugging
            this.authenticated = false;
            return true; // Not authorized if API call fails (e.g., 401, 403)
          }
          this.authenticated = true;
          return false; // Authorized if API call succeeds
        } catch (error) {
          // Removed console.error to reduce clutter; consider logging critical errors in production
          this.authenticated = false;
          return true; // Consider not authorized on any error (e.g., network failure)
        }
      };

      /**
       * Checks authentication status and redirects based on the current path and login state.
       * @param {string} currentPath The current route path.
       * @returns {Promise<void>}
       */
      self.checkAuthAndRedirect = async function (currentPath) {
        var isAuthenticated = self.isLoggedIn();
        if (currentPath === "signin" || currentPath === "signup") {
          if (isAuthenticated) {
            // Redirect to dashboard if user is logged in and accessing signin/signup
            CoreRouter.rootInstance.go({ path: "dashboard" });
          }
        } else {
          if (!isAuthenticated) {
            // Redirect to signin if user is not logged in
            CoreRouter.rootInstance.go({ path: "signin" });
          } else {
            var isNotAuthorized = await self.notAuthorized();
            if (isNotAuthorized) {
              // Clear invalid token and redirect to signin if not authorized
              sessionStorage.removeItem('authToken');
              sessionStorage.removeItem('userId');
              CoreRouter.rootInstance.go({ path: "signin" });
            }
          }
        }
      };

      // Subscribe to route changes for navbar visibility and authentication enforcement
      self.selection.path.subscribe(function (currentPath) {
        // Toggle navbar visibility based on route
        var navbarVisible = currentPath !== "signin" && currentPath !== "signup";
        self.isNavbarVisible(navbarVisible);
        // Perform authentication check and redirection
        self.checkAuthAndRedirect(currentPath);
      });

      // Initial setup for navbar visibility and authentication
      var initialPath = self.selection.path() || "dashboard";
      var initialNavbarVisible = initialPath !== "signin" && initialPath !== "signup";
      self.isNavbarVisible(initialNavbarVisible);
      self.checkAuthAndRedirect(initialPath);

      // Navigation drawer setup
      self.sideDrawerOn = ko.observable(false);
      // Close drawer on medium and larger screens
      self.mdScreen.subscribe(() => { self.sideDrawerOn(false) });
      
      /**
       * Toggles the visibility of the navigation drawer.
       */
      self.toggleDrawer = () => {
        self.sideDrawerOn(!self.sideDrawerOn());
      };
    }

    // Release the application bootstrap busy state
    Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    return new ControllerViewModel();
  }
);