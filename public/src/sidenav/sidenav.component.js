angular.module('MemeWorld')
.component('sidenav', {
    templateUrl: 'src/sidenav/sidenav.template.html',
    controller: SideNav
});

SideNav.$inject = ['$mdSidenav', '$rootScope', '$mdDialog', '$mdMedia', 'PostsService'];

function SideNav($mdSidenav, $rootScope, $mdDialog, $mdMedia, PostsService) {
    const ctrl = this;
    ctrl.selectedFilter = 'popular';
    
    ctrl.setFilter = function(filter) {
        ctrl.selectedFilter = filter;
        $rootScope.orderPostsBy = (filter === 'new' ? '-createdAt' : '-upvotes.length');
        $rootScope.posts = PostsService.allPosts;
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

    ctrl.showMyPosts = function() {
        if (!PostsService.allPosts) {
            return;
        }
        const posts = PostsService.allPosts.filter(post => {
            return (post.author === $rootScope.user._id);
        });
        if (posts.length === 0) {
            $mdDialog.show(
                $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('You have not posted any memes :(')
                    .textContent('Please post some dank memes and spread some laughter in this grim world :)')
                    .ariaLabel('No Posts')
                    .ok('Okay')
            );
        }
        else {
            ctrl.setFilter('myPosts');
            $rootScope.posts = posts;
        }
    };
}

NewPostController.$inject = ['$mdDialog', '$http', '$state', 'PostsService'];

function NewPostController($mdDialog, $http, $state, PostsService) {
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
            if (PostsService.allPosts) {
                PostsService.allPosts.push(res.data);
            }
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
    };
}