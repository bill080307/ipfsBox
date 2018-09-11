$(function () {
    if(!window.ipfs){
        alert("请开启ipfs插件！");
        return '';
    }
    $.get("./database.json",function (res) {
        if(localStorage.getItem("files")==null||res.updatetime>localStorage.getItem("updatetime")){
            localStorage.setItem("files",JSON.stringify(res.files));
            localStorage.setItem("boxfilelist",JSON.stringify(res.boxfilelist));
            localStorage.setItem("totalsize",JSON.stringify(res.totalsize));
            localStorage.setItem("updatetime",res.updatetime);
            localStorage.setItem("path","[]");
            localStorage.setItem("Unpublish","0");
        }else {
            localStorage.setItem("Unpublish","1");
        }
        Refreshfiles();
    });
    $("#do_fileupload").click(function () {
        var file = $("#file_upload").get(0).files;
        var reader = new FileReader();
        const filesupload = [];
        for(var i=0;i<file.length;i++) {
            reader.readAsArrayBuffer(file[i]);
            var name = file[i].name;
            reader.onload = function() {
                filesupload.push({
                    'path':name,
                    'content':Buffer.from(this.result),
                });
                if(i==file.length){
                    ipfs.files.add(filesupload, function (err, res) {
                        var files = JSON.parse(localStorage.getItem("files"));
                        var path=JSON.parse(localStorage.getItem("path"));
                        for(var j=0;j<res.length;j++){
                            var temp = {
                                "title":res[j].path,
                                "type":"file",
                                "fileType":res[j].path.substring(res[j].path.lastIndexOf(".")+1).toLowerCase(),
                                "size":res[j].size,
                                "publishTime":new Date().getTime(),
                                "ipfsPath":res[j].hash
                            };
                            filesadd(files,path.slice(0),temp);
                        }
                        localStorage.setItem("files",JSON.stringify(files));
                        localStorage.setItem("updatetime",new Date().getTime());
                        localStorage.setItem("Unpublish","1");
                        $('#fileupload').modal('hide');
                        Refreshfiles();
                    })
                }
            }
        }
    });
    $("html").on("click","#updir", function() {
        var directory = $("#directoryname").val();
        var temp = {
            "title":directory,
            "type":"dir",
            "fileType":"dir",
            "size":0,
            "publishTime":new Date().getTime(),
            "files":[]
        };
        var files = JSON.parse(localStorage.getItem("files"));
        var path = JSON.parse(localStorage.getItem("path"));
        filesadd(files,path.slice(0),temp);
        localStorage.setItem("files",JSON.stringify(files));
        localStorage.setItem("updatetime",new Date().getTime());
        localStorage.setItem("Unpublish","1");
        $('#directory').modal('hide');
        Refreshfiles();
    });
    $("html").on("click","#uplink", function() {
        var title = $("#title1").val();
        var link = $("#link2").val();
        var files = JSON.parse(localStorage.getItem("files"));
        var path = JSON.parse(localStorage.getItem("path"));
        var temp = {
            "title":title,
            "type":"link",
            "fileType":"link",
            "size":0,
            "publishTime":new Date().getTime(),
            "ipfsPath":link
        };
        filesadd(files,path.slice(0),temp);
        localStorage.setItem("files",JSON.stringify(files));
        localStorage.setItem("updatetime",new Date().getTime());
        localStorage.setItem("Unpublish","1");
        $('#link').modal('hide');
        Refreshfiles();
    });
    $("html").on("click",".breadcrumb>.breadcrumb-item a", function() {
        var path = JSON.parse(localStorage.getItem("path"));
        path = path.slice(0,$(this).data("id"));
        localStorage.setItem("path",JSON.stringify(path));
        Refreshfiles();
    });
    $("html").on("click",".rename", function() {
        var files = JSON.parse(localStorage.getItem("files"));
        var path = JSON.parse(localStorage.getItem("path"));
        var title = $(this).parent().parent().find(".title").text();
        title = prompt("重命名", title);
        if(!title){
            return false;
        }
        filesrename(files,path.slice(0),$(this).data("id"),title);
        localStorage.setItem("files",JSON.stringify(files));
        localStorage.setItem("updatetime",new Date().getTime());
        localStorage.setItem("Unpublish","1");
        Refreshfiles();
    });
    $("html").on("click",".delete", function() {
        if (confirm("仅删除网盘索引！")) {
            var files = JSON.parse(localStorage.getItem("files"));
            var path = JSON.parse(localStorage.getItem("path"));
            filesdel(files,path.slice(0),$(this).data("id"));
            localStorage.setItem("files",JSON.stringify(files));
            localStorage.setItem("updatetime",new Date().getTime());
            localStorage.setItem("Unpublish","1");
            Refreshfiles();
        }
    });
    $("#publish").click(function () {
        var files = JSON.parse(localStorage.getItem("files"));
        localStorage.setItem("totalsize",resizetotal(files));
        localStorage.setItem("files",JSON.stringify(files));
        var boxfilelist = JSON.parse(localStorage.getItem("boxfilelist"));
        const filesupload = [];
        filesupload.push({
            'path': "database.json",
            'content': Buffer.from(JSON.stringify({
                "files":files,
                "boxfilelist":boxfilelist,
                "updatetime":localStorage.getItem("updatetime"),
                "totalsize":localStorage.getItem("totalsize")
            }))
        });
        $.ajaxSettings.async = false;
        for(var i=0;i<boxfilelist.length;i++){
            $.get(boxfilelist[i],function (res) {
                filesupload.push({
                    'path': boxfilelist[i],
                    'content': Buffer.from(res),
                });
            })
        }
        $.ajaxSettings.async = true;
        ipfs.files.add(filesupload, {"wrapWithDirectory":true},function (err, res) {
            var hash = res[res.length-1]["hash"];
            $.get("http://127.0.0.1:5001/api/v0/key/list",function (res) {
                var key = res.Keys;
                var Id = '';
                for(var i=0;i<key.length;i++){
                    if(key[i].Name=="ipfsBox")Id = key[i].Id;
                }
                $.ajaxSettings.async = false;
                if (Id==''){
                    $.get("http://127.0.0.1:5001/api/v0/key/gen",{
                        "arg":"ipfsBox",
                        "type":"rsa",
                        "size":2048
                    },function (res) {
                        Id = res.Id;
                    })
                }
                $.ajaxSettings.async = true;
                $.ajax({
                    url: "http://127.0.0.1:5001/api/v0/name/publish",
                    timeout: 1000999,
                    type: 'get',
                    data: {
                        "arg": hash,
                        "key": Id
                    },
                    dataType: 'json',
                    success: function (data) {
                        self.location = "https://ipfs.io/ipns/" + data.Name;
                    }
                })
            });
            console.log(res);
        });
    });
});

function Refreshfiles() {
    var files1 = JSON.parse(localStorage.getItem("files"));
    var path = JSON.parse(localStorage.getItem("path"));
    for (var i=0;i<path.length;i++){
        var k=0;
        for (var j=0;j<files1.length;j++){
            if(files1[j]["title"]==path[i]){
                k=j;
                break;
            }
        }
        files1=files1[k]["files"];
    }
    var html ="";
    for(var i =0;i<files1.length;i++){
        html+='<tr data-key='+files1[i].ipfsPath+'>\n' +
            '                    <td>'+files1[i].type+' / '+files1[i].fileType+'</td>\n' +
            '                    <td class="title">'+files1[i].title +'</td>\n' +
            '                    <td>'+plugin(files1[i])+'</td>\n' +
            '                    <td>'+formatSize(files1[i].size)+'</td>\n' +
            '                    <td>'+formatDate(files1[i].publishTime)+'</td>\n' +
            '                    <td>\n' +
            '                      <a class="dropdown-item rename" href="javascript:void(0)" data-id="'+i+'"><i class="icon-retweet"></i> 重命名</a>\n' +
            '                      <a class="dropdown-item delete" href="javascript:void(0)" data-id="'+i+'"><i class="icon-trash"></i> 删除</a>\n' +
            '                    </td>\n' +
            '                </tr>';
    }
    $("tbody").html(html);
    if(localStorage.getItem("Unpublish")=="1"){
        $("#publish").removeAttr("disabled");
    }else {
        $("#publish").attr("disabled");
    }
    $('.breadcrumb>.breadcrumb-item.add').siblings().remove();
    var bread = "<li class=\"breadcrumb-item\"><a href=\"javascript:void(0)\" data-id='0'>首页</a></li>";
    for (var i =0;i<path.length;i++) {
        bread += "<li class=\"breadcrumb-item\"><a href=\"javascript:void(0)\" data-id='"+i+1+"'>"+path[i]+"</a></li>";
    }
    $('.breadcrumb').prepend(bread);
}






function filesrename(files,path,index,title) {
    if (path.length==0){
        for(var i =0;i<files.length;i++){
            if(files[i].title==title){
                alert("同一文件夹下存在相同名称");
                return false;
            }
        }
        files[index].title=title;
        return files;
    }else {
        var k=0;
        for (var i=0;i<files.length;i++){
            if(files[i]["title"]==path[0]){
                k=i;
                break;
            }
        }
        path.splice(0,1);
        return filesrename(files[i]["files"],path,index,title);
    }
}


function filesadd(files,path,item) {
    if (path.length==0){
        for(var i =0;i<files.length;i++){
            if(files[i].title==item.title){
                alert("同一文件夹下存在相同名称");
                return false;
            }
        }
        files.push(item);
        return files;
    }else {
        var k=0;
        for (var i=0;i<files.length;i++){
            if(files[i]["title"]==path[0]){
                k=i;
                break;
            }
        }
        path.splice(0,1);
        return filesadd(files[i]["files"],path,item);
    }
}
function filesdel(files,path,index) {
    if (path.length == 0) {
        files.splice(index, 1);
        return files;
    } else {
        var k = 0;
        for (var i = 0; i < files.length; i++) {
            if (files[i]["title"] == path[0]) {
                k = i;
                break;
            }
        }
        path.splice(0, 1);
        return filesdel(files[i]["files"], path, index);
    }
}
function resizetotal(files) {
    var size = 0;
    for(var i = 0;i<files.length;i++){
        if(files[i].type=="dir"){
            files[i].size=resizetotal(files[i].files);
        }
        size +=parseInt(files[i].size);
    }
    return size;
}
function formatDate(time){
    var date = new Date(time);

    var year = date.getFullYear(),
        month = date.getMonth()+1,//月份是从0开始的
        day = date.getDate(),
        hour = date.getHours(),
        min = date.getMinutes(),
        sec = date.getSeconds();
    var preArr = Array.apply(null,Array(10)).map(function(elem, index) {
        return '0'+index;
    });////开个长度为10的数组 格式为 00 01 02 03

    var newTime = year + '-' +
        (preArr[month]||month) + '-' +
        (preArr[day]||day) + ' ' +
        (preArr[hour]||hour) + ':' +
        (preArr[min]||min) + ':' +
        (preArr[sec]||sec);

    return newTime;
}
function formatSize(value){
    if(null==value||value==''){
        return "0 B";
    }
    var unitArr = ["B","KB","MB","GB","TB","PB","EB","ZB","YB"];
    var index=0,
        srcsize = parseFloat(value);
    index=Math.floor(Math.log(srcsize)/Math.log(1024));
    var size =srcsize/Math.pow(1024,index);
    //  保留的小数位数
    size=size.toFixed(2);
    return size+unitArr[index];
}
function plugin(item) {
    plu = plugin_file;
    var buttom="";
    if(plu.type.test(item.type)&&plu.filetype.test(item.filetype)){
        buttom+=plu.button;
    }
    plu = plugin_dir;
    if(plu.type.test(item.type)&&plu.filetype.test(item.filetype)){
        buttom+=plu.button;
    }
    plu = plugin_link;
    if(plu.type.test(item.type)&&plu.filetype.test(item.filetype)){
        buttom+=plu.button;
    }
    return buttom;
}
