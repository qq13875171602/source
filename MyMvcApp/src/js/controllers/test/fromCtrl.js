(function() {

  var ctrls = angular.module("controllers");
  ctrls.controller("TestIndexCtrlas", ["$scope", "$log", TestIndexCtrlas]);

  function TestIndexCtrlas($scope, $log) {
    $log.debug("TestIndexCtrl init...");

    // 处理scope销毁  index.debug.html
    $scope.$on("$destroy", function() {
      $log.debug("TestIndexCtrl destroy...");
    });

    $scope.formdata = {};
    $scope.tosubmit = function() {
      $log.debug("提交的数据是：", $scope.formdata);
    };

  }


})();