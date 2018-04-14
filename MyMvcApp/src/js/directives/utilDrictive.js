(function() {
  var app = angular.module("directives");

  app.directive("formatDate", ["$log", "utilservice", function($log, utilservice) {
    $log.debug("format-date init....");
    return {
      scope: {
        formatDate: "@"
      },
      link: function($scope, element, attr) {


        var watch = $scope.$watch("formatDate", function(nv, ov) {
          $log.debug("format-date watch:", nv);
          var ts = parseInt(nv.replace(/\D/g, ""));
          $log.debug("format-date watch===>", ts);
          element.html(utilservice.formatDate(ts, "y-M-d h:m:s w"));
        });

        $scope.$on("$destroy", function() {
          $log.debug("dir-one destroy....");
          watch();
        });

      }
    };



  }]);
})();