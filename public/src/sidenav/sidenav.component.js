angular.module('MemeWorld')
.component('sidenav', {
    templateUrl: 'src/sidenav/sidenav.template.html',
    controller: SideNav
});

SideNav.$inject = ['$mdSidenav'];

function SideNav($mdSidenav) {
    const ctrl = this;
    ctrl.selectedFilter = 'popular';
    ctrl.setFilter = function (filter) {
        ctrl.selectedFilter = filter;
    }
}