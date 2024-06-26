import express from 'express';
import bodyParser from 'body-parser';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';

var articles = [];

const app = express()
const port = 3000
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.use(express.static('public'))

// 今日の日付を取得
const today = new Date();

// 月の英語表記を定義する配列
const months = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// 月、日、年を取得
const month = months[today.getMonth()]; // 0-indexedなので注意
const day = today.getDate();
const year = today.getFullYear();

// 日付を指定されたフォーマットに変換
const formattedDate = `${month} ${day}, ${year}`;


app.get("/", function (req, res) {

  articles = [];

  fs.createReadStream('articles.csv')
  .pipe(csv())
  .on('data', (row) => {
    articles.push(row);
  })
  .on('end', () => {
    console.log('CSVファイルの読み込みが完了しました');
    processArticles(); 
  });

  function processArticles() {
    res.render("index.ejs", {articles: articles});
  } 
});


app.get("/about", function (req, res) {
  res.render("about.ejs");
});


app.get("/contact", function (req, res) {
  res.render("contact.ejs");
});


app.get("/post", function (req, res) {

  articles = [];

  fs.createReadStream('articles.csv')
  .pipe(csv())
  .on('data', (row) => {
    articles.push(row);
  })
  .on('end', () => {
    console.log('CSVファイルの読み込みが完了しました');

    processArticles(); 
  });

  function processArticles() {
    var article;
    articles.forEach(data => {
      if(data['id']===req.query.id) {
        article = data;
      }
    });
    res.render("post.ejs", {article: article});
  }

});


app.get("/edit_post", function (req, res) {
    if(req.query.id) {

      articles = [];
      var article;

      fs.createReadStream('articles.csv')
      .pipe(csv())
      .on('data', (row) => {
        articles.push(row);
      })
      .on('end', () => {
        console.log('CSVファイルの読み込みが完了しました');

        processArticles(); 
      });

      function processArticles() {
        articles.forEach(data => {
          if(data['id']===req.query.id) {
            article = data;
            article['content'] = article['content'].replace(/<br>/g, '\n');;
          }
        });
        res.render("edit_post.ejs", {article: article});
      }
    } else {
      res.render("edit_post.ejs", {article: article});
    }
});


app.post("/edit_post", function (req, res) {
  var article = req.body;

  if(article['id']==='') {

    article['id']= uuidv4();
    article['date'] = formattedDate;
    article['content'] = article['content'].replace(/\r?\n/g, '<br>');
    articles.push(article);

    var i = articles.findIndex(item => item['id'] === article['id']);
    articles[i].title = article.title;
    articles[i].subtitle = article.subtitle;
    articles[i].author = article.author;
    articles[i].content = article.content;

  } else {

    var i = articles.findIndex(item => item['id'] === article['id']);
    articles[i].title = article.title;
    articles[i].subtitle = article.subtitle;
    articles[i].author = article.author;
    articles[i].content = article.content;

  }

  const csvWriter = createObjectCsvWriter({
    path: 'articles.csv',
    header: [
        { id: 'id', title: 'id' },
        { id: 'title', title: 'title' },
        { id: 'subtitle', title: 'subtitle' },
        { id: 'author', title: 'author' },
        { id: 'content', title: 'content' },
        { id: 'date', title: 'date' },
    ],
  });

  csvWriter.writeRecords(articles)
  .then(() => {
      console.log('CSV file successfully written');
  })
  .catch((err) => {
      console.error('Error writing CSV:', err);
      res.status(500).send('Error writing CSV file');
  });
  
  res.redirect("/");
  
});


app.get("/delete_post", function (req, res) {

  // 読み込んだCSVデータを格納する配列
  articles = []

  // CSVファイルを読み込む
  fs.createReadStream('articles.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (row.id !== req.query.id) {
      articles.push(row);
    }
  })
  .on('end', () => {
    console.log('CSVファイルの読み込みが完了しました');

    const csvWriter = createObjectCsvWriter({
      path: 'articles.csv',
      header: [
          { id: 'id', title: 'id' },
          { id: 'title', title: 'title' },
          { id: 'subtitle', title: 'subtitle' },
          { id: 'author', title: 'author' },
          { id: 'content', title: 'content' },
          { id: 'date', title: 'date' },
      ],
    });
  
    csvWriter.writeRecords(articles)
    .then(() => {
        console.log('CSV file successfully written');
    })
    .catch((err) => {
        console.error('Error writing CSV:', err);
        res.status(500).send('Error writing CSV file');
    });
    
    res.redirect("/");

  });


  
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})