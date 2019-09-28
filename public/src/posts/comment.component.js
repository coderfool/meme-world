angular.module('MemeWorld')
.component('comment', {
    templateUrl: 'src/posts/comment.template.html',
    controller: CommentController,
    bindings: {
        comment : '=data',
        index: '<',
        removeComment: '&',
        updateComment: '&'
    }
});

CommentController.$inject = ['$rootScope', '$http', '$mdDialog', '$mdMedia'];

function CommentController($rootScope, $http, $mdDialog, $mdMedia) {
    const ctrl = this;
    
    ctrl.$onInit = function() {
        ctrl.upvoted = isUpvoted();
        ctrl.downvoted = isDownvoted();
        ctrl.owns = ($rootScope.user && ctrl.comment.author === $rootScope.user._id);
        ctrl.comment.date = new Date(ctrl.comment.createdAt).toDateString();
    };

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
    };

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
    };
    
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
    };

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
    };

    ctrl.showCommentMenu = function($mdMenu, $event) {
        $mdMenu.open($event);
    };

    ctrl.showRemoveDialog = function() {
        const confirm = $mdDialog.confirm()
            .title('Are you sure you want to delete this comment?')
            .ariaLabel('Delete comment')
            .ok('Yes')
            .cancel('No');

        $mdDialog.show(confirm)
        .then(function() {
            $http.delete(`../../posts/comments/${ctrl.comment._id}`)
            .then(function(res) {
                ctrl.removeComment({index: ctrl.index});
            })
            .catch(function(err) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('Could not delete comment :(')
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

    ctrl.showEditDialog = function() {
        $mdDialog.show({
            templateUrl: 'src/posts/edit-comment.template.html',
            clickOutsideToClose: true,
            fullscreen: !$mdMedia('gt-sm'),
            controller: EditCommentController,
            controllerAs: 'ctrl',
            locals: {
                comment: ctrl.comment
            }
        })
        .then(function(res) {
            ctrl.updateComment({index: ctrl.index, comment: res});
        })
        .catch(angular.noop);
    };
}

EditCommentController.$inject = ['$mdDialog', 'PostsService', 'comment'];

function EditCommentController($mdDialog, PostsService, comment) {
    const ctrl = this;

    ctrl.comment = {
        id: comment._id,
        author: comment.author,
        text: comment.text,
        image: comment.image
    };

    ctrl.messages = {
        imageTooLarge: 'Max. image size should be 8 MB',
        default: 'Something went wrong. Please check your internet connection and try again.'
    };

    ctrl.$onInit = function() {
        ctrl.imgSrc = comment.image ? `data:image/png;base64,${comment.image}` : '';
    };
    
    ctrl.close = function() {
        $mdDialog.hide();
    };

    ctrl.close = function(value) {
        $mdDialog.hide(value);
    };

    ctrl.cancel = function() {
        $mdDialog.cancel();
    };

    ctrl.setImageSrc = function(src, imgFile) {
        ctrl.imgSrc = src;
        ctrl.comment.image = imgFile;
    };

    ctrl.removeImage = function() {
        ctrl.comment.image = null;
        ctrl.imgSrc = '';
        ctrl.clearErrors();
    };

    ctrl.clearErrors = function() {
        ctrl.err = '';
    };

    ctrl.saveComment = function(valid) {
        if (!valid) {
            return;
        }
        
        PostsService.editComment(ctrl.comment)
        .then(res => {
            ctrl.close(res.data);
        })
        .catch(err => {
            if (err.data && err.data.error && err.data.error.status === 413) {
                ctrl.err = 'Max. image size should be 8 MB';
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