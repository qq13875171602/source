(function () {
  var app=angular.module("controllers");
  app.controller('login', ['$scope',"$log","$location","DialogService","DataService", login]);
      function login($scope,$log,$location,DialogService,DataService){
          $log.debug("login....");
          
          $scope.$on("$destroy",function () {
              $log.debug("控制器销毁");
          });

          $scope.formdata={};

          $scope.reset=function() {
            $scope.formdata={};
          };

          $scope.login=function() {
            DialogService.showWaitDialog("登录中...");
             DataService.send("/User/Index",$scope.formdata,function (err,data) {
                  DialogService.hideWaitDialog();
                  if(err){
                    $log.error(err);
                    DialogService.showAlertDialog("服务器忙,请稍后");
                    return;
                  }
                  if(data.Success)
                  {
                    DialogService.showAlertDialog("登录成功");
                    $log.debug(data.Datas.user);
                    DataService.setuserInfo(data.Datas.user);
                    $location.path("/route/page/user/loginout");
                    return;
                  }
                  DialogService.showAlertDialog(data.ServerMessage);
             });
          };

      }
})();