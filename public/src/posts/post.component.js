angular.module('MemeWorld')
.component('post', {
    templateUrl: 'src/posts/post.template.html',
    controller: PostController,
    bindings: {
        post : '=data'
    }
});

PostController.$inject = ['$rootScope', '$http'];

function PostController($rootScope, $http) {
    const ctrl = this;
    
    ctrl.$onInit = function() {
        ctrl.imageSrc = 'data:image/png;base64,' + ctrl.post.image;
        ctrl.upvoted = isUpvoted();
        ctrl.downvoted = isDownvoted();
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
            ctrl.upvoted = isUpvoted();
            ctrl.downvoted = isDownvoted();
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
            ctrl.upvoted = isUpvoted();
            ctrl.downvoted = isDownvoted();
        })
        .catch(err => {
            console.error(err);
        });
    }
}