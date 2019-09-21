angular.module('MemeWorld')
.component('sidenav', {
    templateUrl: 'src/sidenav/sidenav.template.html',
    controller: SideNav
});

SideNav.$inject = ['$mdSidenav', '$rootScope', '$mdDialog', '$mdMedia'];

function SideNav($mdSidenav, $rootScope, $mdDialog, $mdMedia) {
    const ctrl = this;
    ctrl.selectedFilter = 'popular';
    
    ctrl.setFilter = function(filter) {
        ctrl.selectedFilter = filter;
        $rootScope.orderPostsBy = (filter === 'popular' ? '-upvotes.length' : '-createdAt');
    };

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
    };
}

NewPostController.$inject = ['$mdDialog', '$http', '$state'];

function NewPostController($mdDialog, $http, $state) {
    const ctrl = this;
    ctrl.title = '';
    ctrl.image = null;

    ctrl.close = function() {
        $mdDialog.hide();
    }
    
    ctrl.clearErrors = function() {
        ctrl.err = '';
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
            ctrl.close();
            $state.go('post', {postId: res.data._id});
        })
        .catch(err => {
            if (err.data && err.data.error && err.data.error.status === 413) {
                ctrl.err = 'Max. image size should be 15 MB';
            }
            else if (err.data && err.data.error) {
                ctrl.err = err.data.error.message;
            }
            else {
                console.error(err);
            }
        });
    }
}