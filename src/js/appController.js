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

      let navData = [
        { path: '', redirect: 'dashboard' },
        { path: 'dashboard', detail: { label: 'Dashboard', iconClass: 'oj-ux-ico-information-s' } },
        { path: 'signin', detail: { label: 'Sign In', iconClass: 'oj-ux-ico-information-s' } },
        { path: 'signup', detail: { label: 'Sign Up', iconClass: 'oj-ux-ico-information-s' } },
        { path: 'myaccounts', detail: { label: 'My Accounts', iconClass: 'oj-ux-ico-information-s' } },
        { path: 'statements', detail: { label: 'Statements', iconClass: 'oj-ux-ico-information-s' } },
        { path: 'createaccount', detail: { label: 'Create Account', iconClass: 'oj-ux-ico-information-s' } },
        { path: 'transfer', detail: { label: 'Transfer', iconClass: 'oj-ux-ico-information-s' } },
        { path: 'profile', detail: { label: 'Profile', iconClass: 'oj-ux-ico-information-s' } },
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

      // Listen to route changes to toggle navbar visibility
      self.selection.path.subscribe(function (currentPath) {
        console.log("Route changed to:", currentPath);
        // Hide navbar on signin and signup pages
        var visible = currentPath !== "signin" && currentPath !== "signup";
        self.isNavbarVisible(visible);
        console.log("Navbar visibility set to:", visible);
      });

      // Initial check for navbar visibility based on current route
      var initialPath = self.selection.path() || "dashboard";
      var initialVisible = initialPath !== "signin" && initialPath !== "signup";
      self.isNavbarVisible(initialVisible);
      console.log("Initial route:", initialPath, "Navbar visibility:", initialVisible);

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