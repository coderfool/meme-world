angular.module('MemeWorld')
.component('comment', {
    templateUrl: 'src/posts/comment.template.html',
    controller: CommentController,
    bindings: {
        comment : '=data'
    }
});

CommentController.$inject = ['$rootScope', '$http'];

function CommentController($rootScope, $http) {
    const ctrl = this;
    ctrl.owns = true;

    ctrl.$onInit = function() {
        ctrl.upvoted = isUpvoted();
        ctrl.downvoted = isDownvoted();
        ctrl.owns = ($rootScope.user !== null && ctrl.comment.author === $rootScope.user._id);
    }

    function isUpvoted() {
        if (!$rootScope.loggedIn) {
            return false;
        }
        for (i in ctrl.comment.upvotes) {
            if (ctrl.comment.upvotes[i] === $rootScope.user._id) {
                return true;
            }
        }
        return false;
    }

    function isDownvoted() {
        if (!$rootScope.loggedIn) {
            return false;
        }
        for (i in ctrl.comment.downvotes) {
            if (ctrl.comment.downvotes[i] === $rootScope.user._id) {
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
        $http.get(`../../posts/comments/${ctrl.comment._id}/upvote`)
        .then(res => {
            ctrl.comment = res.data;
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
        $http.get(`../../posts/comments/${ctrl.comment._id}/downvote`)
        .then(res => {
            ctrl.comment = res.data;
            ctrl.upvoted = isUpvoted();
            ctrl.downvoted = isDownvoted();
        })
        .catch(err => {
            console.error(err);
        });
    }

    ctrl.showCommentMenu = function($mdMenu, $event) {
        $mdMenu.open($event);
    }
}