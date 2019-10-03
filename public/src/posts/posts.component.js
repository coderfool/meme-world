angular.module('MemeWorld')
.component('posts', {
    templateUrl: 'src/posts/posts.template.html',
    controller: PostsController,
});

PostsController.$inject = ['PostsService', '$rootScope'];

function PostsController(PostsService, $rootScope) {
    const ctrl = this;
    
    $rootScope.posts = [];
    ctrl.messages = {
        default: 'Something went wrong. Please check your internet connection and try again.'
    };

    ctrl.loadPosts = function(index) {
        ctrl.processing = true;
        PostsService.getPosts(index)
        .then(res => {
            $rootScope.posts = [...$rootScope.posts, ...res];
            ctrl.showLoadMore = !(res.length === 0);
            ctrl.processing = false;
        })
        .catch(err => {
            if (err.xhrStatus !== 'abort') {
                ctrl.err = true;
                console.error(err);
                ctrl.processing = false;
            }
        });
    };

    if (PostsService.allPosts) {
        $rootScope.posts = PostsService.allPosts;
        ctrl.showLoadMore = true;
    }
    else {
        ctrl.loadPosts(0);
    }

    ctrl.removePost = function(postId) {
        for (let i = 0; i < $rootScope.posts.length; i++) {
            if ($rootScope.posts[i]._id === postId) {
                $rootScope.posts.splice(i, 1);
                break;
            }
        }
    };
}