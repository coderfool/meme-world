angular.module('MemeWorld')
.controller('ExpandedPostController', ExpandedPostController);

ExpandedPostController.$inject = ['PostsService', 'postId', '$rootScope', '$state'];

function ExpandedPostController(PostsService, postId, $rootScope, $state) {
    const ctrl = this;
    ctrl.newComment = '';
    ctrl.selectedFilter = 'top';
    ctrl.orderComments = '-upvotes.length';
    ctrl.messages = {
        commentsEmpty: 'No comments yet. Be the first one to comment.',
        imageTooLarge: 'Max. image size should be 15 MB',
        default: 'Something went wrong. Please check your internet connection and try again.'
    };
    
    const post = PostsService.getPost(postId);
    post.then(res => {
        ctrl.post = res.data;
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
    }

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
            if (err.data.error.status === 413) {
                ctrl.err = ctrl.messages.imageTooLarge;
            }
            else {
                ctrl.err = err.data.error.message;
            }
        });
    }
    
    ctrl.setFilter = function(filter) {
        ctrl.selectedFilter = filter;
        if (filter === 'top') {
            ctrl.orderComments = '-upvotes.length';
        }
        else if (filter === 'new') {
            ctrl.orderComments = '-createdAt';
        }
    }
}