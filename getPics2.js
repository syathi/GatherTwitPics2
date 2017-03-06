/*
    つくってからかなり時間が経ってから開発再開したのでそのうちリファクタリングする
*/

const util = require('util'),
    twitter = require('twit'),
    fs = require('fs'),
    app = require('http').createServer();

const twit = new twitter({//アカウント認証
    consumer_key:        '',
    consumer_secret:     '',
    access_token:        '',
    access_token_secret: '',
    timeout_ms:           3 * 60 * 1000 //３分でタイムアウト
});
var stream;
var id = '2911017872', num = 10, stat;
var isConnect = false; //ストリーミング接続が有効かどうか

// エラーハンドリング
process.on('uncaughtException', (err) => {
    console.log(err.stack);
});

//クライアントへのレスポンス
app.on('request', (req, res) => {
    if(req.url == "/"){
        fs.readFile('./index.html', 'utf8', (err, text) => {
            if(err){
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write('not found!');
                return res.end();
            }
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(text);
            res.end();
        });
    }
    if(req.url == "/style.css"){
        fs.readFile('./style.css', 'utf8', (err, data) => {
            if(err){
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write("not found css");
                res.end();
            }
            res.writeHead(200, {'Content-Type': 'text/css'});
            res.write(data);
            res.end();
        }); 
    }
}).listen(3030);//ポート

const io = require('socket.io').listen(app);
io.sockets.on('connection', (socket) => {
    socket.on('search', (text, fn) => {
        fn(text + " was successfully sent");
        searchWord(text, num);
        if(isConnect) disCnctStream(stream);
        stream = twit.stream( 'statuses/filter', { track : text })
        cnctStream(text);
    });
});


//ストリーミング接続して新しく検索ワードに当てはまるツイートを取得する
function cnctStream(text){
    stream.on('tweet', (tweet) => {
        isConnect = true;
        console.log("\nストリーミング接続しました。" + text + "を検索します。\n");
        // フィルターされたデータのストリームを受け取り、ツイートのテキストを表示する
        getTweet(tweet);
    }); 
}

function disCnctStream(stream){
    console.log("ストリーミングを切断しています");
    stream.stop();
    isConnect = false;
}

function searchWord(text, num){
    twit.get('search/tweets', {q : text, count : num}, (error, data, response) => {
        console.log(text + "を検索します。");
        for(i = 1; i < num; i++){
            //console.log("でーたでーたでーた : " + data.statuses);
            stat = data.statuses[i];
            getTweet(stat);
        }
    });
}

function getTweet(data){
    try{
        if(data.entities && data.entities.media && data.entities.media[0].media_url){
            console.log(data.user.name + '  |  ' +  data.user.screen_name + "\n" + data.text);
            console.log("タグ付きうらる：" + "<a href='" + data.entities.media[0].media_url + "' />");
            //io.sockets.emit('msg', data.user.name + '  |  ' +  data.user.screen_name + "\n" + data.text);
            io.sockets.emit('msg',  "<a href='" + data.entities.media[0].media_url + "' >" + 　
                                        "<img src='" + data.entities.media[0].media_url + "' height='300px' />" + 
                                    "</a>");
        }
    }catch(er){console.log(er);}
}

console.log('Server running...');