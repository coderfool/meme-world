angular.module('MemeWorld', ['ngMaterial', 'ngMessages', 'ui.router', 'ui.router.state.events'])
.config(config)
.factory('jwtInterceptor', jwtInterceptor)
.factory('loadingHttpInterceptor', loadingHttpInterceptor)
.controller('AppController', AppController)
.run(['$rootScope', '$http', function($rootScope, $http) {
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        $http.pendingRequests.forEach(function(request) {
            if (request.cancel) {
                request.cancel.resolve();
            }
        });
    });
}]);

config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider'];

function config($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $stateProvider
    .state('home', {
        url: '/',
        templateUrl: '/src/home/home.template.html'
    })
    .state('post', {
        url: '/posts/{postId}',
        templateUrl: 'src/posts/post-expanded.template.html',
        controller: 'ExpandedPostController as ctrl',
        resolve: {
            postId: ['$stateParams', function($stateParams) {
                return $stateParams.postId;
            }]
        }
    });

    $urlRouterProvider.otherwise('/');
    $locationProvider.hashPrefix('');
    $httpProvider.interceptors.push('jwtInterceptor');
    $httpProvider.interceptors.push('loadingHttpInterceptor');
}

AppController.$inject = ['$mdDialog', '$mdMedia', '$mdSidenav', '$rootScope', '$http'];

function AppController($mdDialog, $mdMedia, $mdSidenav, $rootScope, $http) {
    const ctrl = this;
    $rootScope.showSidenav = true;
    const jwt = localStorage.getItem('jwt');
    if (jwt === null) {
        $rootScope.loggedIn = false;
    }
    else {
        $http.get(`../users/verifyJWT/${jwt}`)
        .then(res => {
            if (res.data.expired) {
                $rootScope.loggedIn = false;
                localStorage.removeItem('jwt');
                localStorage.removeItem('user');
            }
            else {
                $rootScope.loggedIn = true;
                $rootScope.user = JSON.parse(localStorage.getItem('user'));
            }
        })
        .catch(err => {
            if (err.data && err.data.error && err.data.error.message === 'jwt expired') {
                $rootScope.loggedIn = false;
                localStorage.removeItem('jwt');
                localStorage.removeItem('user');
            }
            else {
                console.error(err);
            }
        });
    }
    
    $rootScope.$mdMedia = $mdMedia;
    
    $rootScope.loginPrompt = function() {
        $mdDialog.show({
            templateUrl: 'src/login/login.template.html',
            clickOutsideToClose: true,
            fullscreen: !$mdMedia('gt-xs'),
            controller: LoginController,
            controllerAs: 'ctrl'
        });
    };

    $rootScope.signupPrompt = function() {
        $mdDialog.show({
            templateUrl: 'src/registration/registration.template.html',
            clickOutsideToClose: true,
            fullscreen: !$mdMedia('gt-xs'),
            controller: RegistrationController,
            controllerAs: 'ctrl'
        });
    };

    ctrl.showUserMenu = function($mdMenu, $event) {
        $mdMenu.open($event);
    };

    ctrl.showProfileDialog = function() {
        $mdDialog.show({
            templateUrl: 'src/profile/profile.template.html',
            clickOutsideToClose: true,
            fullscreen: !$mdMedia('gt-xs'),
            controller: ProfileController,
            controllerAs: 'ctrl'
        });
    };

    ctrl.logOut = function() {
        $http.get('../users/logout')
        .then(res => {
            localStorage.removeItem('jwt');
            localStorage.removeItem('user');
            $rootScope.loggedIn = false;
            $rootScope.user = null;
        })
        .catch(err => {
            console.error(err);
        });
    };

    ctrl.toggleSidenav = function() {
        $mdSidenav('left-sidenav').toggle();
    };
}

LoginController.$inject = ['$mdDialog', '$http', '$rootScope'];

function LoginController($mdDialog, $http, $rootScope) {
    const ctrl = this;
    ctrl.username = '';
    ctrl.password = '';
    ctrl.email = '';
    ctrl.err = {};
    ctrl.messages = {
        unauthorized: 'Invalid username or password',
        invalidEmail: 'Please enter your correct registered email',
        passwordReset: 'An email has been sent to you with further instructions',
        default: 'Something went wrong. Please check your internet connection and try again.'
    }

    ctrl.close = function() {
        $mdDialog.hide();
    };
    
    ctrl.clearMessages = function() {
        ctrl.err = {};
        ctrl.passwordReset = false;
    };

    ctrl.showForgotPassword = function() {
        ctrl.forgot = true;
    };

    ctrl.resetPassword = function(valid) {
        ctrl.clearMessages();
        ctrl.passwordReset = false;
        if (!valid) {
            return;
        }
        $http.post(`../users/forgotPassword`, {
            email: ctrl.email
        })
        .then(res => {
            ctrl.passwordReset = true;
        })
        .catch(err => {
            if (err.data && err.data.error && err.data.error.status === 404) {
                ctrl.err.invalidEmail = true;
            }
            else if (err.data && err.data.error) {
                ctrl.err.other = true;
                ctrl.messages.other = err.data.error.message;
            }
            else {
                ctrl.err.default = true;
                console.error(err);
            }
        });
    }

    ctrl.submit = function(valid) {
        if (!valid) {
            return;
        }

        ctrl.processing = true;

        $http.post('../users/login', {
            username: ctrl.username,
            password: ctrl.password
        })
        .then(res => {
            localStorage.setItem('jwt', res.data.token);
            $http.get(`../users/${res.data.userId}`)
            .then(res => {
                localStorage.setItem('user', JSON.stringify(res.data));
                $rootScope.user = res.data;
                ctrl.close();
                $rootScope.loggedIn = true;
            })
            .catch(err => {
                console.error(err);
            });
            ctrl.processing = false;
        })
        .catch(err => {
            ctrl.err.unauthorized = true;
            ctrl.processing = false;
        });
    }
}

jwtInterceptor.$inject = ['$q'];

function jwtInterceptor($q) {
    return {
        request: function(config) {
            const jwt = localStorage.getItem('jwt');
            if (jwt) {
                config.headers['Authorization'] = 'bearer ' + jwt;
            }
            return config;
        },
        requestError: function(err) {
            return $q.reject(err);
        }
    };
}

loadingHttpInterceptor.$inject = ['$rootScope', '$q'];

function loadingHttpInterceptor($rootScope, $q) {
    let loadingCount = 0;
    const eventName = 'httpLoading';

    return {
        request: function(config) {
            if (++loadingCount === 1) {
                $rootScope.$broadcast(eventName, {on: true});
            }
            return config;
        },
        response: function(res) {
            if (--loadingCount === 0) {
                $rootScope.$broadcast(eventName, {on: false});
            }
            return res;
        },
        responseError: function(err) {
            if (--loadingCount === 0) {
                $rootScope.$broadcast(eventName, {on: false});
            }
            return $q.reject(err);
        }
    };
}