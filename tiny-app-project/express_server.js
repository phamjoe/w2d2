const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080
app.set('view engine', 'ejs');

var urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());

//  login with username
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// logout and clear cookies
app.post('/logout', (req, res) => {
  res.clearCookie('username', req.body.username);
  res.redirect('/urls');
})

app.get('/', (req, res) => {
  res.redirect(301, `/urls`);
});
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
app.get('/urls', (req, res) => {
  let templateVars = {
    username: req.cookies['username'],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});
//  page to add new link
app.get('/urls/new', (req, res) => {
  let templateVars = {
    username: req.cookies.username,
    urls: urlDatabase,
    shortURL: req.params.id
  };
  res.render('urls_new', templateVars);
});
//  find by id
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    username: req.cookies.username,
    urls: urlDatabase,
    shortURL: req.params.id
  };
  res.render('urls_show', templateVars);
});

//  delete given the short url id
app.delete('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(301, "/urls");
});

app.post('/urls/', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(301, `/urls/${shortURL}`);
});

//  update user info
app.put('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;

  res.redirect(301, `/urls/${req.params.id}`);
});

app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let random = Math.random()
    .toString(36)
    .substring(7);
  return random;
}
