/**
 * 数据服务
 */
(function() {
    var app = angular.module("services");

    app.factory("DataService", ["$log", "$http","$cookies","$rootScope","$window", DataService]);

    function DataService($log, $http,$cookies,$rootScope,$window) {
        $log.info("DataService init...");
        var server_url = "";//服务器跟路径
        var token="";//token值
        var token_key="server_token";//本地token值保存的名称

        var service = {};

        service.setServer = function(server) {
            server_url = server;
        };

        service.send = function(url, postdata, cb) {
            //获取本地保存的token
            token=$cookies.get("token_key");
            if(!token)
            {
                token="";
            }
            //发送给服务器
            postdata.SessionToken=token;
            postdata.ajaxtimestamp = new Date().getTime(); // 自动加时间戳
            $http({
                "method": "POST",
                "url": server_url + url,
                "data": postdata
            }).then(function(data, status) {
                $log.debug("DataService.data:", data.data);
                //应答成功保存服务器的token
                $cookies.put("token_key",data.data.SessionToken);
                (cb || angular.noop)(null, data.data);
            }, function(data, status) {
                $log.error("DataService.send error:", data);
                (cb || angular.noop)(data, null);
            });
        };

        service.setuserInfo=function(user){
            $window.localStorage.user=JSON.stringify(user);
            $rootScope.loginuser=user;
        };
        service.removeUserInfo=function () {
            delete $window.localStorage.user;
            delete $rootScope.loginuser;
        };

        service.loadLocalUser=function () {
            var suer=$window.localStorage.user;
            if(!suer){
                return;
            }try {
                $rootScope.loginuser=JSON.parse(suer);
            } catch(e) {
                // statements
                console.log(e);
            }
        };
        return service;
    }

})();