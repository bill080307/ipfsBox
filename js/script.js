var API = "http://127.0.0.1:5001";
var GETWAY = "http://127.0.0.1:8080";


var path = [];


$(function () {
    $.get("database.json",function (res) {
        if(localStorage.getItem("files")==null||res.updatetime>localStorage.getItem("updatetime")){
            localStorage.setItem("files",JSON.stringify(res.files));
            localStorage.setItem("boxfilelist",JSON.stringify(res.boxfilelist));
            localStorage.setItem("totalsize",JSON.stringify(res.totalsize));
            localStorage.setItem("updatetime",res.updatetime);
            localStorage.setItem("path","/");
        }else if(res.updatetime==localStorage.getItem("updatetime")){
            localStorage.setItem("Unpublish","0");
        }else {
            localStorage.setItem("Unpublish","1");
        }
        $("#totalsize").html(localStorage.getItem("totalsize"));
        Refreshfiles();
    });
    $("#Home").click(function () {
        path=[];
        Refreshfiles();
    })
    $("html").on("click","#uplink", function() {
        var title = $("#title1").val();
        var link = $("#link2").val();
        var files = JSON.parse(localStorage.getItem("files"));
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
        $('#link').modal('hide');
        localStorage.setItem("updatetime",new Date().getTime());
        localStorage.setItem("Unpublish","1");
        Refreshfiles();
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
        filesadd(files,path.slice(0),temp);
        $('#directory').modal('hide');
        localStorage.setItem("files",JSON.stringify(files));
        localStorage.setItem("updatetime",new Date().getTime());
        localStorage.setItem("Unpublish","1");
        Refreshfiles();
    })
    $("#do_fileupload").click(function () {
        var fd = new FormData();
        fd.append("file", $("#file_upload").get(0).files[0]);
        $.ajax({
            url: API+"/api/v0/add",
            type: "POST",
            processData: false,
            contentType: false,
            data: fd,
            success: function(data) {
                var files = JSON.parse(localStorage.getItem("files"));
                var temp = {
                    "title":data.Name,
                    "type":"file",
                    "fileType":data.Name.substring(data.Name.lastIndexOf(".")+1).toLowerCase(),
                    "size":data.Size,
                    "publishTime":new Date().getTime(),
                    "ipfsPath":data.Hash
                };
                filesadd(files,path.slice(0),temp);
                localStorage.setItem("files",JSON.stringify(files));
                $('#fileupload').modal('hide');
                localStorage.setItem("updatetime",new Date().getTime());
                localStorage.setItem("Unpublish","1");
                Refreshfiles();
            }
        })
    })
    $("html").on("click",".breadcrumb>.breadcrumb-item a", function() {
        path = path.slice(0,$(this).data("id"));
        Refreshfiles();
    })
    $("html").on("click",".rename", function() {
        var files = JSON.parse(localStorage.getItem("files"));
        var title = $(this).parent().parent().parent().parent().find(".title").text();
        title = prompt("重命名", title);

        filesrename(files,path.slice(0),$(this).data("id"),title);
        localStorage.setItem("files",JSON.stringify(files));
        localStorage.setItem("updatetime",new Date().getTime());
        localStorage.setItem("Unpublish","1");
        Refreshfiles();
    })
    $("html").on("click",".delete", function() {
        if (confirm("仅删除网盘索引！")) {
            var files = JSON.parse(localStorage.getItem("files"));
            filesdel(files,path.slice(0),$(this).data("id"));
            localStorage.setItem("files",JSON.stringify(files));
            localStorage.setItem("updatetime",new Date().getTime());
            localStorage.setItem("Unpublish","1");
            Refreshfiles();
        }
    });
    //发布
    $("#publish").click(function () {
        alert("根据节点性能不同，请耐心等待，预计2分钟左右！")
        var files = JSON.parse(localStorage.getItem("files"));
        localStorage.setItem("totalsize",resizetotal(files))
        localStorage.setItem("files",JSON.stringify(files));

        // TODO:2 建立缓存目录
        // TODO:3 上传文件夹
        $.get(API+"/api/v0/key/list",function (res) {
            $("#publish").prepend("<i class='icon-spinner'></i>");
            var key = res.Keys;
            var Id = '';
            for(var i=0;i<key.length;i++){
                if(key[i].Name=="ipfsBox")Id = key[i].Id;
            }
            if (Id!=''){
                $.ajax({
                    url: API + "/api/v0/name/publish",
                    timeout: 1000999,
                    type: 'get',
                    data: {
                        "arg": "QmcfUBJo6uUTLaLJ9ABJeLWYygzjGzhN5CbnDijve4u18u",
                        "key": Id
                    },
                    dataType: 'json',//返回的数据格式
                    success: function (data) { //请求成功的回调函数
                        self.location = GETWAY + "/ipns/" + data.Name;
                    }
                })
            } else {
                $.get(API+"/api/v0/key/gen",{
                    "arg":"ipfsBox",
                    "type":"rsa",
                    "size":2048
                },function (res) {
                    Id = res.Id;
                    // TODO:4 发布
                })
            }
        })
    })
});


function Refreshfiles() {
    var files1=JSON.parse(localStorage.getItem("files"));
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
            '                    <td>'+files1[i].size+'</td>\n' +
            '                    <td>'+formatDate(files1[i].publishTime)+'</td>\n' +
            '                    <td>\n' +
            '                        <div class="dropdown open">\n' +
            '                            <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\n' +
            '                                <i class="icon-cog"></i> 更多\n' +
            '                            </button>\n' +
            '                            <div class="dropdown-menu" aria-labelledby="dropdownMenu1">\n' +
            '                                <a class="dropdown-item rename" href="javascript:void(0)" data-id="'+i+'"><i class="icon-retweet"></i> 重命名</a>\n' +
            '                                <a class="dropdown-item delete" href="javascript:void(0)" data-id="'+i+'"><i class="icon-trash"></i> 删除</a>\n' +
            '                            </div>\n' +
            '                        </div>\n' +
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
    var bread = "<li class=\"breadcrumb-item\"><a href=\"javascript:void(0)\" data-id='0'><i class=\"icon-home\"></i></a></li>";
    for (var i =0;i<path.length;i++) {
        bread += "<li class=\"breadcrumb-item\"><a href=\"javascript:void(0)\" data-id='"+i+1+"'>"+path[i]+"</a></li>";
    }
    $('.breadcrumb').prepend(bread);
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
function filesadd(files,path,item) {
    if (path.length==0){
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
function filesrename(files,path,index,title) {
    if (path.length==0){
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
function filesdel(files,path,index) {
    if (path.length==0){
        files.splice(index,1);
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
        return filesdel(files[i]["files"],path,index);
    }
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