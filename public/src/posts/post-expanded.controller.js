angular.module('MemeWorld')
.controller('ExpandedPostController', ExpandedPostController);

ExpandedPostController.$inject = ['PostsService', 'postId', '$rootScope', '$state', '$mdToast', '$mdDialog', '$http'];

function ExpandedPostController(PostsService, postId, $rootScope, $state, $mdToast, $mdDialog, $http) {
    const ctrl = this;
    ctrl.newComment = '';
    ctrl.selectedFilter = 'top';
    ctrl.orderCommentsBy = '-upvotes.length';
    ctrl.messages = {
        commentsEmpty: 'No comments yet. Be the first one to comment.',
        imageTooLarge: 'Max. image size should be 15 MB',
        default: 'Something went wrong. Please check your internet connection and try again.'
    };
    
    const post = PostsService.getPost(postId);
    post.then(res => {
        ctrl.post = res.data;
        ctrl.owns = ($rootScope.user && ctrl.post.author === $rootScope.user._id);
        const comments = PostsService.getComments(postId);
        comments.then(res => {
            ctrl.post.comments = res.data;
        })
        .catch(err => {
            console.error(err);
        });
    })
    .catch(err => {
        console.error(err);
        $state.go('home');
    });

    ctrl.removeImage = function() {
        ctrl.image = null;
        ctrl.imgSrc = '';
    };

    ctrl.submitComment = function(valid) {
        if (!$rootScope.loggedIn) {
            $rootScope.loginPrompt();
            return;
        }
        
        if (!valid || (ctrl.newComment.trim() === '' && !ctrl.image)) {
            return;
        }

        const comment = {
            text: ctrl.newComment,
            image: ctrl.image
        };
        
        PostsService.addComment(postId, comment)
        .then(res => {
            ctrl.post.comments.push(res.data);
            ctrl.removeImage();
            commentForm.reset();
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
    
    ctrl.setFilter = function(filter) {
        ctrl.selectedFilter = filter;
        ctrl.orderCommentsBy = (filter === 'top' ? '-upvotes.length' : '-createdAt');
    };

    ctrl.removeComment = function(index) {
        ctrl.post.comments.splice(index, 1);
    };

    ctrl.updateComment = function(index, comment) {
        ctrl.post.comments[index] = comment;
    };

    ctrl.setImageSrc = function(src, imgFile) {
        ctrl.imgSrc = src;
        ctrl.image = imgFile;
    };

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
            $http.delete(`../../posts/${ctrl.post._id}`)
            .then(function(res) {
                $state.go('home');
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('Post was deleted successfully')
                    .position('left right')
                    .hideDelay(2000)
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
                    .hideDelay(2000)
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
            $http.put(`../../posts/${postId}`, { title: res })
            .then(function(res) {
                ctrl.post = {...ctrl.post, ...res.data};
            })
            .catch(function(err) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('Could not update post :(')
                    .position('left right')
                    .hideDelay(2000)
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
    }
}