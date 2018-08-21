'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'myApp.home',
  'myApp.login',
  'myApp.version'
]).

config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider.otherwise({redirectTo: '/login'});
}]).

run([ '$rootScope', '$location', 'LoginService', function($rootScope, $location, LoginService) {
  var routesPermission = ['/home'];
  $rootScope.$on('$routeChangeStart', function() {
    if(routesPermission.indexOf($location.path()) != -1 && !LoginService.isLogged()) {
      $location.path('/login');
    }
  });

}])
;
