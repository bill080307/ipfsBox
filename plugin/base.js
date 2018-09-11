var plugin_file = new Object;
plugin_file.name="文件类型插件";
plugin_file.type=/file/;
plugin_file.filetype=/./;
plugin_file.button="<button type=\"button\" class=\"btn btn-sm btn-success plugin_file\">下载</button>";
plugin_file.execute=function () {
    $("html").on("click",".plugin_file", function() {
        var path = $(this).parent().parent().data("key");
        window.open("https://ipfs.io/ipfs/"+path);
    })
};
plugin_file.execute();


var plugin_dir = new Object;
plugin_dir.name="目录";
plugin_dir.type=/dir/;
plugin_dir.filetype=/./;
plugin_dir.button="<button type=\"button\" class=\"btn btn-sm btn-success plugin_dir\">进入</button>";
plugin_dir.execute=function () {
    $("html").on("click",".plugin_dir", function() {
        var title = $(this).parent().parent().find(".title").text();
        var path = JSON.parse(localStorage.getItem("path"));
        path.push(title);
        localStorage.setItem("path",JSON.stringify(path));
        Refreshfiles();
    })
};
plugin_dir.execute();


var plugin_link = new Object;
plugin_link.name="链接";
plugin_link.type=/link/;
plugin_link.filetype=/./;
plugin_link.button="<button type=\"button\" class=\"btn btn-sm btn-success plugin_link\">打开</button>";
plugin_link.execute=function () {
    $("html").on("click",".plugin_link", function() {
        var path = $(this).parent().parent().data("key");
        window.open("https://ipfs.io/ipfs/"+path);
    })
};
plugin_link.execute();