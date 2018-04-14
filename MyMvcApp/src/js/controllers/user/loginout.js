(function () {
  var app=angular.module("controllers");
  app.controller('loginout', ['$scope',"$log","$location","DialogService","DataService", loginout]);
      function loginout($scope,$log,$location,DialogService,DataService){
          $log.debug("login....");
          
          $scope.$on("$destroy",function () {
              $log.debug("控制器销毁3");
          });

          $scope.loginout=function () {
              DialogService.showWaitDialog("安全退出中");
              DataService.removeUserInfo();
              DataService.send("/User/Index",{},function (err,data) {
                  DialogService.hideWaitDialog();
                  $log.debug(err,data);
                  $location.path("/route/page/user/login");
              });
          };

          
        }
})();