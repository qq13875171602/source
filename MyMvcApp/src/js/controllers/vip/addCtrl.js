(function() {
  var ctrls = angular.module("controllers");
  ctrls.controller("addIndexCtrl", ["$scope", "$log", "DialogService", "DataService", addIndexCtrl]);

  function addIndexCtrl($scope, $log, DialogService, DataService) {
    $log.debug("addIndexCtrl init...");

    // 处理scope销毁  index.debug.html
    $scope.$on("$destroy", function() {
      $log.debug("addIndexCtrl destroy...");
    });


    $scope.formdata = {};

    $scope.close = function() {
      DialogService.hideCustomDialog();
    };

    $scope.add = function() {
      DialogService.showWaitDialog("开卡中....");
      DataService.send("/VipCard/Add", $scope.formdata, function(err, data) {
        DialogService.hideWaitDialog();
        if (err) {
          DialogService.showAlertDialog("服务器忙...");
          $log.debug(err);
          return;
        }
        if (data.Success) {
          DialogService.showAlertDialog("开卡成功", function() {
            DialogService.hideCustomDialog();
          });
          return;
        }
        DialogService.showAlertDialog(data.ServerMessage);
      });
    };


  }
})();