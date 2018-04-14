(function(win) {
  win.MyAppConfig = {
    "name": "myapp",
    "title": "我的Angular应用"
  };

  //第一个myapp的模块，引用controllers模块
  var app = angular.module(MyAppConfig.name, ["ngRoute", "ngCookies", "ngSanitize", "ngAnimate", "ngMessages", "controllers", "services", "directives"]);
  // 初始化控制器，服务，指令三大模块
  angular.module("controllers", []);
  angular.module("services", []);
  angular.module("directives", []);

  //配置日志是否开启debug
  app.config(["$logProvider", function($logProvider) {
    $logProvider.debugEnabled(true);
  }]);

  // 处理ajax请求
  app.config(["$httpProvider", function($httpProvider) {
    /* post提交可以使用json数据 */
    $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded;charset=utf-8";
    var parseParams = function(params) { // 参数处理
      var query = "",
        name, value, fullSubName, subName, subValue, innerObj, i;
      for (name in params) {
        value = params[name];
        if (value instanceof Array) {
          for (i = 0; i < value.length; i++) {
            subValue = value[i];
            fullSubName = name + "[" + i + "]";
            innerObj = {};
            innerObj[fullSubName] = subValue;
            query += parseParams(innerObj) + "&";
          }
        } else if (value instanceof Object) {
          for (subName in value) {
            subValue = value[subName];
            fullSubName = name + "." + subName;
            innerObj = {};
            innerObj[fullSubName] = subValue;
            query += parseParams(innerObj) + "&";
          }
        } else if (value !== undefined && value !== null) {
          query += encodeURIComponent(name) + "=" + encodeURIComponent(value) + "&";
        }
      }
      var querydata = query.length ? query.substr(0, query.length - 1) : query;
      return querydata;
    };

    $httpProvider.defaults.transformRequest = [function(data) {
      var formdata = angular.isObject(data) && String(data) !== "[object File]" ? parseParams(data) : data;
      return formdata;
    }];

    /* 请求错误统一跳转到错误页面 */
    $httpProvider.interceptors.push(["$q", "$log", "$location", function($q, $log, $location) {
      return {
        "responseError": function(rejection) {
          $log.debug("应答发生错误：", rejection);
          if (rejection.config.url.substr(0, 9) == "templates") {
            $log.debug("模板页不存在==>", rejection.config.url);
            $location.path("/"); // 找不到模板转到首页，也可以跳转到统一的404错误页
          }
          return $q.reject(rejection);
        }
      };
    }]);

  }]);

  // 配置路由
  app.config(["$routeProvider", function($routeProvider) {
    $routeProvider.when("", {
      redirectTo: "/route/page/index"
    }).when("/", {
      redirectTo: "/route/page/index"
    }).when("/index", {
      redirectTo: "/route/page/index"
    }).when("/route/:path*", {
      templateUrl: "templates/route.html"
    }).otherwise({
      redirectTo: "/route/page/index"
    });
  }]);

})(window);
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
/**
 * 对话框服务
 */
(function() {
    var services = angular.module("services");

    services.factory("DialogService", ["$rootScope", "$log", "$timeout", DialogService]);

    function DialogService($rootScope, $log, $timeout) {
        $log.info("DialogService init...");
        var service = {};

        // 通用标题设置
        var dialogTitle = "信息";

        service.setDialogTitle = function(title) {
            dialogTitle = title;
        };

        var tempDialogTitle = null;

        service.setTempDialogTitle = function(title) {
            tempDialogTitle = title;
        };

        /* 确定对话框 ========================================================== */
        var alertBtnOk = "确定";
        var tempAlertBtnOk = null;

        service.setAlertBtnOk = function(ok) {
            tempAlertBtnOk = ok;
        };

        var alertDialog = {
            "closefn": angular.noop,//
            "hasinit": false,
        };

        service.setAlertDialog = function(dialog) {
            $log.debug("DialogService.setAlertDialog==>", dialog);
            alertDialog.scope = dialog.scope;//检索当前元素或者父元素
            alertDialog.element = dialog.element;//把传进来的dom或者html元素转化为jquery对象
            alertDialog.element.on("hidden.bs.modal", function() {//然后为这个对象绑定事件
                // 执行并重置回调函数
                var cb = alertDialog.closefn;
                alertDialog.closefn = angular.noop;
                cb();
            });
            alertDialog.hasinit = true;

        };

        service.showAlertDialog = function(info, cb) {
            if (!alertDialog.hasinit) {
                $log.debug("DialogService.showAlertDialog not init...");
                return;
            }

            $timeout(function() {
                alertDialog.closefn = (cb || angular.noop);
                alertDialog.scope.alertInfo = info;
                alertDialog.scope.alertTitle = (tempDialogTitle || dialogTitle);
                alertDialog.scope.alertBtnOk = (tempAlertBtnOk || alertBtnOk);
                tempDialogTitle = null;
                tempAlertBtnOk = null;
                alertDialog.element.modal("show");
            });
        };

        service.hideAlertDialog = function() {
            alertDialog.element.modal("hide");
        };
        /* ========================================================== */

        /* 等待对话框 ========================================================== */
        var waitDialog = {
            "closefn": angular.noop,
            "hasinit": false,
        };

        service.setWaitDialog = function(dialog) {
            $log.debug("DialogService.setWaitDialog==>", dialog);
            waitDialog.scope = dialog.scope;
            waitDialog.element = dialog.element;
            waitDialog.element.on("hidden.bs.modal", function() {
                // 执行并重置回调函数
                var cb = waitDialog.closefn;
                waitDialog.closefn = angular.noop;
                cb();
            });
            waitDialog.hasinit = true;
        };

        service.showWaitDialog = function(info, cb) {
            if (!waitDialog.hasinit) {
                $log.debug("DialogService.showWaitDialog not init...");
                return;
            }

            $timeout(function() {
                waitDialog.closefn = (cb || angular.noop);
                waitDialog.scope.waitInfo = info;
                waitDialog.scope.waitTitle = (tempDialogTitle || dialogTitle);
                tempDialogTitle = null;
                waitDialog.element.modal("show");
            });
        };

        service.hideWaitDialog = function() {
            waitDialog.element.modal("hide");
        };
        /* ========================================================== */

        /* 自定义对话框 ========================================================== */

        var confirmBtnYes = "确定";
        var confirmBtnNo = "取消";

        var tempConfirmBtnYes = null;
        var tempConfirmBtnNo = null;

        service.setConfirmBtnYes = function(yes) {
            tempConfirmBtnYes = yes;
        };

        service.setConfirmBtnNo = function(no) {
            tempConfirmBtnNo = no;
        };

        var confirmDialog = {
            "yesfn": angular.noop,
            "nofn": angular.noop,
            "choose": "no",
            "hasinit": false
        };

        service.setConfirmDialog = function(dialog) {
            $log.debug("DialogService.setConfirmDialog==>", dialog);
            confirmDialog.scope = dialog.scope;
            confirmDialog.element = dialog.element;
            confirmDialog.hasinit = true;
        };

        service.showConfirmDialog = function(info, cby, cbn) {
            if (!confirmDialog.hasinit) {
                $log.debug("DialogService.showConfirmDialog not init...");
                return;
            }
            $timeout(function() {
                confirmDialog.yesfn = (cby || angular.noop);
                confirmDialog.nofn = (cbn || angular.noop);
                confirmDialog.scope.confirmInfo = info;
                confirmDialog.scope.confirmTitle = (tempDialogTitle || dialogTitle);
                tempDialogTitle = null;
                alertDialog.scope.confirmBtnYes = (tempConfirmBtnYes || confirmBtnYes);
                alertDialog.scope.confirmBtnNo = (tempConfirmBtnNo || confirmBtnNo);
                tempConfirmBtnYes = null;
                tempConfirmBtnNo = null;

                confirmDialog.element.on("hidden.bs.modal", function() {
                    // 执行并重置回调函数
                    var cb = (confirmDialog.choose == "no") ? confirmDialog.nofn : confirmDialog.yesfn;
                    confirmDialog.choose = "no";
                    confirmDialog.nofn = angular.noop;
                    confirmDialog.yesfn = angular.noop;
                    cb();
                });

                confirmDialog.element.modal("show");
            });
        };

        service.hideConfirmDialog = function() {
            confirmDialog.element.modal("hide");
        };

        service.confirmOk = function() {
            confirmDialog.choose = "yes";
            service.hideConfirmDialog();
        };
        service.confirmCancel = function() {
            confirmDialog.choose = "no";
            service.hideConfirmDialog();
        };

        /* ========================================================== */

        /* 自定义对话框 ========================================================== */
        var customDialog = {
            "closefn": angular.noop,
            "hasinit": false,
            "data": {}
        };

        service.setCustomDialog = function(dialog) {
            $log.debug("DialogService.setCustomDialog==>", dialog);
            customDialog.scope = dialog.scope;
            customDialog.element = dialog.element;
            customDialog.element.on("hidden.bs.modal", function() {
                var cb = customDialog.closefn;
                customDialog.closefn = angular.noop;
                cb();
            });
            customDialog.hasinit = true;
        };

        service.showCustomDialog = function(page, data, cb) {
            if (!customDialog.hasinit) {
                $log.debug("DialogService.showCustomDialog not init...");
                return;
            }
            $timeout(function() {
                customDialog.scope.customPage = page;
                page = "";
                customDialog.data = (data || {});
                customDialog.closefn = (cb || angular.noop);
                customDialog.scope.customTitle = (tempDialogTitle || dialogTitle);
                tempDialogTitle = null;
                customDialog.element.modal("show");
            });
        };

        service.hideCustomDialog = function() {
            customDialog.element.modal("hide");
        };

        service.getCustomData = function() {
            var data = customDialog.data;
            customDialog.data = {};
            return data;
        };
        /* ========================================================== */

        return service;
    }

})();
(function() {
  var app = angular.module("services");

   app.factory("utilservice", ["$log", utilservice]);

  

  function utilservice($log) {
    var service = {};
    service.formatDate = function(timstamp, format) {

      var weeks = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      //将时间搓格式化成format指定的数据格式
     
        var data = new Date();
        if (timstamp) { //如果存在时间搓参数就赋值
          data.setTime(timstamp);
        }
        if (!format) { //如果没有格式化参数就给个默认值
          format = "y-M-d";
        }
        //获取时间相关信息
        var year = data.getFullYear();
        var month = data.getMonth() + 1; //月会差一
        var day = data.getDate();
        var hour = data.getHours();
        var minute = data.getMinutes();
        var secound = data.getSeconds();
        var week = data.getDay();
        //处理数据

        month = month < 10 ? "0" + month : "" + month;
        day = day < 10 ? "0" + day : "" + day;
        hour = hour < 10 ? "0" + hour : "" + hour;
        minute = minute < 10 ? "0" + minute : "" + minute;
        secound = secound < 10 ? "0" + secound : "" + secound;
        week = weeks[week];
        //格式化日期字符
        var result = format.replace("y", year);
        result = result.replace("M", month);
        result = result.replace("d", day);
        result = result.replace("h", hour);
        result = result.replace("m", minute);
        result = result.replace("s", secound);
        result = result.replace("w", week);
      


    };


    return service;
  }

})();
/**
 * 对话框自定义指令
 */
(function() {

    var app = angular.module("directives");

    var alertDialogTemplate = "<div class='modal' data-backdrop='static' data-keyboard='false' tabindex='-1' role='dialog' style='z-index: 1990;'>    <div class='modal-dialog modal-sm' role='document'>        <div class='modal-content'>            <div class='modal-header'>                <button type='button' class='close' data-dismiss='modal' aria-label='Close'>                    <span aria-hidden='true'>&times;</span>                </button>                <h4 class='modal-title' ng-bind='alertTitle'></h4>            </div>            <div class='modal-body'>                <div ng-bind-html='alertInfo'></div>            </div>            <div class='modal-footer'>                <button type='button' class='btn btn-default' data-dismiss='modal' ng-bind-html='alertBtnOk'></button>            </div>        </div>    </div></div>";

    app.directive("alertDialog", ["$log", "DialogService", function($log, DialogService) {
        $log.debug("directive alert-dialog...");

        return {
            "restrict": "AE",//指令类型//指令分为4个 E:元素 A:属性 C:样式类 M：注释
            "template": alertDialogTemplate,//指令生成的内容
            "replace": true,//使用模板替换原始标记
            "link": function($scope, element, attr) {
                $scope.$on("$destroy", function() {
                    $log.debug("directive alert-dialog destroy...");
                });

                $log.debug("directive alert-dialog init==>", element);
                DialogService.setAlertDialog({
                    "scope": $scope,
                    "element": element
                });
            }
        };
    }]);

    var waitDialogTemplate = "<div class='modal' data-backdrop='static' data-keyboard='false' tabindex='-1' role='dialog' style='z-index: 2000;'>    <div class='modal-dialog modal-sm' role='document'>        <div class='modal-content'>            <div class='modal-header'>                <div class='modal-title' ng-bind='waitTitle'></div>            </div>            <div class='modal-body'>                <div class='text-center'>                    <span ng-bind-html='waitInfo'></span>                </div>            </div>        </div>    </div></div>";

    app.directive("waitDialog", ["$log", "DialogService", function($log, DialogService) {
        $log.debug("directive wait-dialog...");

        return {
            "restrict": "AE",
            "template": waitDialogTemplate,
            "replace": true,
            "link": function($scope, element, attr) {
                $scope.$on("$destroy", function() {
                    $log.debug("directive wait-dialog destroy...");
                });

                $log.debug("directive wait-dialog init==>", element);
                DialogService.setWaitDialog({
                    "scope": $scope,
                    "element": element
                });
            }
        };
    }]);

    var customDialogTemplate = "<div class='modal' data-backdrop='static' data-keyboard='false' tabindex='-1' role='dialog' style='z-index: 1500;'>    <div class='modal-dialog' role='document'>        <div class='modal-content'>            <div class='modal-header'>                <div class='modal-title' ng-bind='customTitle'></div>            </div>            <div class='modal-body'>                <div ng-include='customPage'></div>            </div>        </div>    </div></div>";

    app.directive("customDialog", ["$log", "DialogService", function($log, DialogService) {
        $log.debug("directive custom-dialog...");

        return {
            "restrict": "AE",
            "template": customDialogTemplate,
            "replace": true,
            "link": function($scope, element, attr) {
                $scope.$on("$destroy", function() {
                    $log.debug("directive custom-dialog destroy...");
                });

                $log.debug("directive custom-dialog init==>", element);
                DialogService.setCustomDialog({
                    "scope": $scope,
                    "element": element
                });
            }
        };
    }]);

    var confirmDialogTemplate = "<div class='modal' data-backdrop='static' data-keyboard='false' tabindex='-1' role='dialog' style='z-index: 1990;'>    <div class='modal-dialog modal-sm' role='document'>        <div class='modal-content'>            <div class='modal-header'>                <h4 class='modal-title' ng-bind='confirmTitle'></h4>            </div>            <div class='modal-body'>                <p ng-bind-html='confirmInfo'></p>            </div>            <div class='modal-footer'>                <button type='button' class='btn btn-default' ng-click='confirmOk()'  ng-bind-html='confirmBtnYes'></button>                <button type='button' class='btn btn-default' ng-click='confirmCancel()' ng-bind-html='confirmBtnNo'></button>            </div>        </div>    </div></div>";

    app.directive("confirmDialog", ["$log", "DialogService", function($log, DialogService) {
        $log.debug("directive confirm-dialog...");

        return {
            "restrict": "AE",
            "template": confirmDialogTemplate,
            "replace": true,
            "link": function($scope, element, attr) {
                $scope.$on("$destroy", function() {
                    $log.debug("directive confirm-dialog destroy...");
                });

                $log.debug("directive confirm-dialog init==>", element);

                DialogService.setConfirmDialog({
                    "scope": $scope,
                    "element": element
                });

                $scope.confirmOk = DialogService.confirmOk;
                $scope.confirmCancel = DialogService.confirmCancel;

            }
        };
    }]);

})();
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
(function() {
    var ctrls = angular.module("controllers");
    ctrls.controller("RootCtrl", ["$rootScope", "$scope", "$log", "$location","DataService", RootCtrl]);

    function RootCtrl($rootScope, $scope, $log, $location,DataService) {
        $log.debug("RootCtrl init...", $location.path());
        //设置初始化后台服务器地址
        DataService.setServer("http://localhost:6286/");
        DataService.loadLocalUser();
        // 处理scope销毁
        $scope.$on("$destroy", function() {
            $log.debug("RootCtrl destroy...");
        });

        // 监听视图切换
        $rootScope.$on("$routeChangeStart", function(event, next, current) {
            $log.debug("route加载页面中：", next, "-", current, "[event]", event);
        });
        $rootScope.$on("$routeChangeSuccess", function(event, current, previous) {
            $log.debug("route加载完毕。。。", current, "-", previous, "[event]", event);
        });
        $rootScope.$on("$routeChangeError", function(event, current) {
            $log.debug("route加载错误。。。", current, "[event]", event);
        });
    }
})();
(function() {
    var ctrls = angular.module("controllers");
    ctrls.controller("RouteCtrl", ["$scope", "$log", "$routeParams", "$location", RouteCtrl]);

    var key = "page/";
    var templatePath = "templates/";
    var templateExt = ".html";

    function RouteCtrl($scope, $log, $routeParams, $location) {
        $log.debug("RouteCtrl $routeParams:", $routeParams.path);

        // 处理scope销毁
        $scope.$on("$destroy", function() {
            $log.debug("RouteCtrl destroy...");
        });

        $scope.init = function() {
            var page = $routeParams.path.replace(key, "");
            $log.debug("RouteCtrl init...", page);
            $scope.template = templatePath + page + templateExt + "?pagetimestamp=" + new Date().getTime();
            $log.debug("RouteCtrl template:", $scope.template);
        };

        $scope.init();
    }
})();
(function() {
  //当文档加载完毕的时候将myapp模块和document绑定
  angular.element(document).ready(function() {

    var app = angular.module(MyAppConfig.name);
    //模块加载前的处理动作，$rootScope是全局范围，在所有地方有效
    app.run(["$rootScope", "$log", function($rootScope, $log) {
      $log.info("模块初始化。。。");
      $rootScope.title = MyAppConfig.title;
    }]);
    
    angular.bootstrap(document, [MyAppConfig.name]);
  });
})();