angular.module('MemeWorld')
.controller('ProfileController', ProfileController);

ProfileController.$inject = ['$rootScope', '$mdDialog', '$mdToast'];

function ProfileController($rootScope, $mdDialog, $mdToast) {
    const ctrl = this;
    ctrl.username = $rootScope.user.username;
    ctrl.email = $rootScope.user.email;
    ctrl.image = $rootScope.user.image;
    ctrl.password = '';
    ctrl.newPassword = '';
    ctrl.imgSrc = $rootScope.user.image ? `data:image/png;base64,${$rootScope.user.image}` : '';
    ctrl.delete = false;
    
    ctrl.close = function() {
        $mdDialog.hide();
    };

    ctrl.setImageSrc = function(src, imgFile) {
        ctrl.imgSrc = src;
        ctrl.image = imgFile;
    };

    ctrl.removeImage = function() {
        ctrl.image = null;
        ctrl.imgSrc = '';
        ctrl.clearErrors();
    };

    ctrl.clearErrors = function() {
        ctrl.err = '';
    }
}