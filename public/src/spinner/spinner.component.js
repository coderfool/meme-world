angular.module('MemeWorld')
.factory('loadingHttpInterceptor', loadingHttpInterceptor)
.component('spinner', {
    template: '<md-progress-circular md-mode="indeterminate" ng-if="$ctrl.show"></md-progress-circular>',
    controller: SpinnerController
});

SpinnerController.$inject = ['$rootScope'];

function SpinnerController($rootScope) {
    const eventName = 'httpLoading';
    const ctrl = this;
    let listener;

    ctrl.$onInit = function() {
        ctrl.show = false;
        listener = $rootScope.$on(eventName, activate);
    };

    ctrl.$onDestroy = function() {
        listener();
    };

    activate = function(event, data) {
        ctrl.show = data.on;
    };
}