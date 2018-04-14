(function () {
    var ctrls = angular.module("controllers");
    ctrls.controller("TestIndexCtrl", ["$scope", "$log", "DialogService","DataService", TestIndexCtrl]);

    function TestIndexCtrl($scope,$log,DialogService,DataService){
        $log.debug("TestIndexCtrl init...");

        // 处理scope销毁  index.debug.html
        $scope.$on("$destroy", function() {
            $log.debug("TestIndexCtrl destroy...");
        });
         
        //设置请求后台数据的服务器根路径,不写就是当前项目
        //改配置只需要写一次
        DataService.setServer("http://localhost:6286/");
        DataService.send("/test",{Echo:"哈哈哈"},function (err,data) {
              //回调参数必然只会有一个值有效
              //如果err参数是null,表示应答正确,否者data就是null
              $log.debug("数据服务",err,data);
        });
         DialogService.showConfirmDialog("确认对话框",function () {
            DialogService.showAlertDialog("确认对话框");
         },function () {
            DialogService.showWaitDialog("等待对话框");
         });





    }
})();