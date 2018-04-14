(function() {

  var ctrls = angular.module("controllers");
  ctrls.controller("vipIndexCtrl", ["$scope", "$log", "DialogService", "DataService", vipIndexCtrl]);

  function vipIndexCtrl($scope, $log, DialogService, DataService) {
    $log.debug("vipIndexCtrl init...");

    // 处理scope销毁  index.debug.html
    $scope.$on("$destroy", function() {
      $log.debug("vipIndexCtrl destroy...");
    });
    DialogService.setDialogTitle("vip开卡管理");
    //设置服务器跟路径(不是必须的)
    DataService.setServer("http://localhost:6286/");

    $scope.query = function() {
      DialogService.showWaitDialog("数据查询中....");

      DataService.send("/VipCard/Query", {}, function(err, data) {
        DialogService.hideWaitDialog();
        if (err) {
          DialogService.showAlertDialog("服务器忙....");
          $log.error(err);
          return;
        }
        $scope.vips = data.Datas.list;


      });
    };
    $scope.add = function() {
      DialogService.showCustomDialog("/templates/vip/add.html");
    };



    $scope.query();



  }
})();