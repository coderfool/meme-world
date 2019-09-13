angular.module('MemeWorld')
.component('sidenav', {
    templateUrl: 'src/sidenav/sidenav.template.html',
    controller: SideNav
});

SideNav.$inject = ['$mdSidenav', '$rootScope', '$mdDialog', '$mdMedia'];

function SideNav($mdSidenav, $rootScope, $mdDialog, $mdMedia) {
    const ctrl = this;
    ctrl.selectedFilter = 'popular';
    ctrl.setFilter = function (filter) {
        ctrl.selectedFilter = filter;
    }

    ctrl.addPostDialog = function() {
        if (!$rootScope.loggedIn) {
            $rootScope.loginPrompt();
            return;
        }
        $mdDialog.show({
            templateUrl: 'src/posts/new-post.template.html',
            clickOutsideToClose: true,
            fullscreen: !$mdMedia('gt-sm'),
            controller: NewPostController,
            controllerAs: 'ctrl'
        });
    }
}

NewPostController.$inject = ['$mdDialog', '$http'];

function NewPostController($mdDialog, $http) {
    const ctrl = this;
    ctrl.title = '';
    ctrl.image = null;

    ctrl.close = function() {
        $mdDialog.hide();
    }
    
    ctrl.clearErrors = function() {
        ctrl.err = '';
    };

    ctrl.removeImage = function() {
        ctrl.image = null;
        ctrl.imgSrc = '';
        document.getElementById('image').value = '';
        ctrl.clearErrors();
    };

    ctrl.submit = function(valid) {
        if (!valid) {
            return;
        }

        const formData = new FormData();
        formData.append('title', ctrl.title);
        formData.append('image', ctrl.image);
        
        $http.post('../posts', formData, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
        .then(res => {
            ctrl.success = 'Post added successfully';
        })
        .catch(err => {
            if (err.data.error.status === 413) {
                ctrl.err = 'Max. image size should be 15 MB';
            }
            else {
                ctrl.err = err.data.error.message;
            }
        });
    }
}