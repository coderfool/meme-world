angular.module('MemeWorld')
.component('posts', {
    templateUrl: 'src/posts/posts.template.html',
    controller: PostsController,
});

PostsController.$inject = ['PostsService', '$rootScope', '$filter'];

function PostsController(PostsService, $rootScope, $filter) {
    const ctrl = this;
    $rootScope.orderPostsBy = '-upvotes.length';
    ctrl.messages = {
        default: 'Something went wrong. Please check your internet connection and try again.'
    };
    ctrl.posts = [];
    PostsService.getPosts()
    .then(res => {
        ctrl.posts = res.data;
    })
    .catch(err => {
        console.error(err);
        if (err.xhrStatus !== 'abort') {
            ctrl.err = true;
        }
    });

    // $rootScope.sortPosts = function(filter) {
    //     if (filter === 'popular') {
    //         ctrl.posts = $filter('orderBy')(ctrl.posts, function(post) {
    //             return post.upvotes.length;
    //         }, true);
    //     }
    //     else if (filter === 'new') {
    //         ctrl.posts = $filter('orderBy')(ctrl.posts, function(post) {
    //             return new Date(post.createdAt).getTime();
    //         }, true);
    //     }
    // };
}