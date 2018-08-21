'use strict';

angular.module('myApp.login', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {
    templateUrl: 'login/login.html',
    controller: 'LoginCtrl'
  });
}])

.directive('loginDirective', [function() {
  return {
    templateUrl: 'login/login.html'
  };
}])

.factory('LoginService', ['SessionService', '$location' , function(SessionService, $location) {
  return {
    login: function(user) {
      console.log(user);
      if(user.email == 'admin@cerenode.io' && user.password == 'ha') {
        var uid = 1234;
        SessionService.set('user', uid);
        $location.path('/home');
      } else {
        $location.path('/login');
      }
    },
    logout: function() {
      SessionService.destroy('user');
      $location.path('/login');
    },
    isLogged: function() {
      if(SessionService.get('user'))
        return true;
    }
  }
}])

.factory('SessionService', ['$http', function($http) {
  return {
    set: function(key, value) {
      console.log(key, value);
      return sessionStorage.setItem(key, value);
    },
    get: function(key) {
      return sessionStorage.getItem(key);
    },
    destroy: function(key) {
      return sessionStorage.removeItem(key);
    }
  }
}])

.controller('LoginCtrl', ['$scope', 'LoginService', function($scope, LoginService) {
  $scope.login = function(user) {
    LoginService.login(user);
  };

  $scope.isLoggedIn = function() {
    return LoginService.isLogged();
  };

  $scope.logout = function() {
    LoginService.logout();
  };
}]);