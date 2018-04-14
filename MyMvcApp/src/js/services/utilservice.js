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