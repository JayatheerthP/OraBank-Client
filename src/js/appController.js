define(['knockout', 'ojs/ojcontext', 'ojs/ojmodule-element-utils', 'ojs/ojknockouttemplateutils', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojknockoutrouteradapter', 'ojs/ojurlparamadapter', 'ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils', 'ojs/ojarraydataprovider',
  'ojs/ojdrawerpopup', 'ojs/ojmodule-element', 'ojs/ojknockout'],
  function (ko, Context, moduleUtils, KnockoutTemplateUtils, CoreRouter, ModuleRouterAdapter, KnockoutRouterAdapter, UrlParamAdapter, ResponsiveUtils, ResponsiveKnockoutUtils, ArrayDataProvider) {
    function ControllerViewModel() {
      var self = this;
      self.KnockoutTemplateUtils = KnockoutTemplateUtils;
      // Handle announcements sent when pages change, for Accessibility.
      self.manner = ko.observable('polite');
      self.message = ko.observable();
      announcementHandler = (event) => {
        self.message(event.detail.message);
        self.manner(event.detail.manner);
      };
      document.getElementById('globalBody').addEventListener('announce', announcementHandler, false);

      // Media queries for responsive layouts
      const smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      self.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      const mdQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);
      self.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

      // Observable to control navbar visibility
      self.isNavbarVisible = ko.observable(true);
      self.authenticated = ko.observable(false);

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
      // Router setup
      let router = new CoreRouter(navData, {
        urlAdapter: new UrlParamAdapter()
      });
      router.sync();
      CoreRouter.rootInstance = router;
      self.moduleAdapter = new ModuleRouterAdapter(router);
      self.selection = new KnockoutRouterAdapter(router);

      // Setup the navDataProvider with the routes, excluding the first redirected route and 'signup'
      let visibleNavData = navData.slice(1).filter(route => route.path !== 'signup').filter(route => route.path !== 'signin');
      self.navDataProvider = new ArrayDataProvider(visibleNavData, { keyAttributes: "path" });

      // API base URL for user service
      self.API_BASE = {
        USER: 'http://localhost:8085/userservice/api/v1'
      };

      // Function to check if user is logged in (based on authToken in sessionStorage)
      self.isLoggedIn = function () {
        var authToken = sessionStorage.getItem('authToken');
        return !!authToken; // Returns true if authToken exists, false otherwise
      };

      // Function to check if user is not authorized by validating token with API
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
            console.log("Authorization check failed with status:", response.status);
            this.authenticated = false;
            return true; // Not authorized if API call fails (e.g., 401, 403)
          }
          this.authenticated = true;
          return false; // Authorized if API call succeeds
        } catch (error) {
          console.error("Error during authorization check:", error);
          this.authenticated = false;
          return true; // Consider not authorized on any error (e.g., network failure)
        }
      };

      // Function to handle authentication check and redirection asynchronously
      self.checkAuthAndRedirect = async function (currentPath) {
        var isAuthenticated = self.isLoggedIn();
        if (currentPath === "signin" || currentPath === "signup") {
          // If user is logged in, redirect to dashboard when accessing signin or signup
          if (isAuthenticated) {
            console.log("User is logged in, redirecting from", currentPath, "to dashboard");
            CoreRouter.rootInstance.go({ path: "dashboard" });
          }
        } else {
          // For all other routes, if user is not logged in or not authorized, redirect to signin
          if (!isAuthenticated) {
            console.log("User is not logged in, redirecting from", currentPath, "to signin");
            CoreRouter.rootInstance.go({ path: "signin" });
          } else {
            // If logged in, perform deeper authorization check
            var isNotAuthorized = await self.notAuthorized();
            if (isNotAuthorized) {
              console.log("User is not authorized, redirecting from", currentPath, "to signin");
              // Optionally clear invalid token
              sessionStorage.removeItem('authToken');
              sessionStorage.removeItem('userId');
              CoreRouter.rootInstance.go({ path: "signin" });
            }
          }
        }
      };

      // Listen to route changes to toggle navbar visibility and enforce authentication
      self.selection.path.subscribe(function (currentPath) {
        console.log("Route changed to:", currentPath);
        // Hide navbar on signin and signup pages
        var navbarVisible = currentPath !== "signin" && currentPath !== "signup";
        self.isNavbarVisible(navbarVisible);
        console.log("Navbar visibility set to:", navbarVisible);

        // Perform authentication check and redirection
        self.checkAuthAndRedirect(currentPath);
      });

      // Initial check for navbar visibility and authentication based on current route
      var initialPath = self.selection.path() || "dashboard";
      var initialNavbarVisible = initialPath !== "signin" && initialPath !== "signup";
      self.isNavbarVisible(initialNavbarVisible);
      console.log("Initial route:", initialPath, "Navbar visibility:", initialNavbarVisible);

      // Initial authentication check and redirection
      self.checkAuthAndRedirect(initialPath);

      // Drawer
      self.sideDrawerOn = ko.observable(false);
      // Close drawer on medium and larger screens
      self.mdScreen.subscribe(() => { self.sideDrawerOn(false) });
      // Called by navigation drawer toggle button and after selection of nav drawer item
      self.toggleDrawer = () => {
        self.sideDrawerOn(!self.sideDrawerOn());
      }
    }
    // release the application bootstrap busy state
    Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    return new ControllerViewModel();
  }
);