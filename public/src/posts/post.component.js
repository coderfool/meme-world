angular.module('MemeWorld')
.component('post', {
    templateUrl: 'src/posts/post.template.html',
    controller: PostController,
    bindings: {
        post : '=data',
        removePost: '<'
    }
});

PostController.$inject = ['$rootScope', '$http', 'PostsService', '$mdDialog', '$mdToast'];

function PostController($rootScope, $http, PostsService, $mdDialog, $mdToast) {
    const ctrl = this;
    
    ctrl.$onInit = function() {
        ctrl.imageSrc = 'data:image/png;base64,' + ctrl.post.image;
        ctrl.upvoted = isUpvoted();
        ctrl.downvoted = isDownvoted();
        ctrl.post.date = new Date(ctrl.post.createdAt).toDateString();
        ctrl.owns = ($rootScope.user && ctrl.post.author === $rootScope.user._id);
    }

    function isUpvoted() {
        if (!$rootScope.loggedIn) {
            return false;
        }
        for (i in ctrl.post.upvotes) {
            if (ctrl.post.upvotes[i] === $rootScope.user._id) {
                return true;
            }
        }
        return false;
    }

    function isDownvoted() {
        if (!$rootScope.loggedIn) {
            return false;
        }
        for (i in ctrl.post.downvotes) {
            if (ctrl.post.downvotes[i] === $rootScope.user._id) {
                return true;
            }
        }
        return false;
    }
    
    ctrl.upvote = function() {
        if (!$rootScope.loggedIn) {
            $rootScope.loginPrompt();
            return;
        }
        $http.get(`../posts/${ctrl.post._id}/upvote`)
        .then(res => {
            ctrl.post = res.data;
            const index = PostsService.allPosts.findIndex(function(post) {
                return post._id === ctrl.post._id;
            });
            PostsService.allPosts[index] = ctrl.post;
            ctrl.upvoted = isUpvoted();
            ctrl.downvoted = isDownvoted();
            PostsService.getComments(ctrl.post._id)
            .then(res => {
                ctrl.post.commentCount = res.data.length;
            })
            .catch(err => {
                console.error(err);
            });
        })
        .catch(err => {
            console.error(err);
        });
    }

    ctrl.downvote = function() {
        if (!$rootScope.loggedIn) {
            $rootScope.loginPrompt();
            return;
        }
        $http.get(`../posts/${ctrl.post._id}/downvote`)
        .then(res => {
            ctrl.post = res.data;
            const index = PostsService.allPosts.findIndex(function(post) {
                return post._id === ctrl.post._id;
            });
            PostsService.allPosts[index] = ctrl.post;
            ctrl.upvoted = isUpvoted();
            ctrl.downvoted = isDownvoted();
            PostsService.getComments(ctrl.post._id)
            .then(res => {
                ctrl.post.commentCount = res.data.length;
            })
            .catch(err => {
                console.error(err);
            });
        })
        .catch(err => {
            console.error(err);
        });
    }

    ctrl.showPostMenu = function($mdMenu, $event) {
        $mdMenu.open($event);
    };

    ctrl.showRemoveDialog = function() {
        const confirm = $mdDialog.confirm()
            .title('Are you sure you want to delete this post?')
            .ariaLabel('Delete post')
            .ok('Yes')
            .cancel('No');

        $mdDialog.show(confirm).then(function() {
            $http.delete(`../posts/${ctrl.post._id}`)
            .then(function(res) {
                ctrl.removePost(ctrl.post._id);
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('Post was deleted successfully')
                    .position('left right')
                    .hideDelay(3000)
                    .action('Close')
                    .actionKey('c')
                    .highlightAction(true)
                    .highlightClass('md-accent'))
                .then(function(res) {
                    $mdToast.hide();
                })
                .catch(angular.noop);
            })
            .catch(function(err) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('Could not delete post :(')
                    .position('left right')
                    .hideDelay(3000)
                    .action('Close')
                    .actionKey('c')
                    .highlightAction(true)
                    .highlightClass('md-accent'))
                .then(function(res) {
                    $mdToast.hide();
                })
                .catch(angular.noop);
                console.error(err);
            });
        }, angular.noop);
    };

    ctrl.showEditDialog = function() {
        const confirm = $mdDialog.prompt()
            .title('Edit Title')
            .placeholder('Title')
            .ariaLabel('Edit Title')
            .initialValue(ctrl.post.title)
            .required(true)
            .ok('Save')
            .cancel('Cancel');

        $mdDialog.show(confirm)
        .then(function(res) {
            $http.put(`../posts/${ctrl.post._id}`, { title: res })
            .then(function(res) {
                ctrl.post = {...ctrl.post, ...res.data};
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('Title updated successfully')
                    .position('left right')
                    .hideDelay(3000)
                    .action('Close')
                    .actionKey('c')
                    .highlightAction(true)
                    .highlightClass('md-accent'))
                .then(function(res) {
                    $mdToast.hide();
                })
                .catch(angular.noop);
            })
            .catch(function(err) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('Could not update post :(')
                    .position('left right')
                    .hideDelay(3000)
                    .action('Close')
                    .actionKey('c')
                    .highlightAction(true)
                    .highlightClass('md-accent'))
                .then(function(res) {
                    $mdToast.hide();
                })
                .catch(angular.noop);
                console.error(err);
            });
        })
        .catch(angular.noop);
    };
}