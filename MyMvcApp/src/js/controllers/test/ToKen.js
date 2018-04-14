(function() {
  var app = angular.module("controllers");
  app.controller('ToKenCtrol', ['$scope', "$log", "DataService", ToKenCtrol]);

  function ToKenCtrol($scope, $log, DataService) {
    $log.debug("ToKenCtrol ass...");
    $scope.$on("$destroy", function() {
      $log.debug("销毁控制器...");
    });

    //获取本地token
   
    DataService.send("/test", {}, function(err, data) {
      if (err) {
        $log.debug(err);
        return;
      }
      $scope.wind = data.SessionToken;
    });

  }
})();