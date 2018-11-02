const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080; // default port 8080
app.set('view engine', 'ejs');

let urlDatabase = {
  'b2xVn2': {
    url: 'http://www.lighthouselabs.ca',
    user_id: 'userRandomID',
    visits : 0,
    uniqueVisits : 0,
    allVisits : []
  },
  '9sm5xK': {
    url: 'http://www.google.com',
    user_id: 'user2RandomID',
    visits : 0,
    uniqueVisits : 0,
    allVisits : []
  }
};

let users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: '$2b$10$FjfbHNWf.16FPTtibIObp.MfXB3ymywvZ3sRrR/mYAJwZJbNy6nHa'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: '$2b$10$FjfbHNWf.16FPTtibIObp.MfXB3ymywvZ3sRrR/mYAJwZJbNy6nHa'
  }
};

function urlsForUser(id) {
  let usersURL = {};
  for (let shortURL of Object.keys(urlDatabase)) {
    if (urlDatabase[shortURL].user_id === id) {
      usersURL[shortURL] = {
        url: urlDatabase[shortURL].url,
        user_id: urlDatabase[shortURL].user_id,
        visits : urlDatabase[shortURL].visits || 0,
        uniqueVisits : urlDatabase[shortURL].uniqueVisits || 0,
        allVisits : urlDatabase[shortURL].allVisits || []
      };
    }
  }
  return usersURL;
}
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
  })
);

//  login with user_id
app.post('/login', (req, res) => {
  const found = Object.values(users).find(user => user.email === req.body.email);
  if (found) {
    const match = bcrypt.compareSync(req.body.password, found.password);
    if (match) {
      req.session.user_id = found.id;
      res.redirect('/urls');
    } else {
      res.sendStatus(403).send('Bad Request');
    }
  } else {
    res.sendStatus(403).send('Bad Request');
  }
});

//  login page
app.get('/urls/login', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase
  };
  res.render('urls_login', templateVars);
});

// logout and clear cookies
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/', (req, res) => {
  res.redirect(301, `/urls`);
});

app.get('/urls', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/urls/login');
  }
  //urlsForUser(req.cookies['user_id']);
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id)
    //urls : urlDatabase
  };
  res.render('urls_index', templateVars);
});

//  page to add new link
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('login');
  } else {
    let templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id),
      shortURL: req.params.id
    };
    res.render('urls_new', templateVars);
  }
});

//  register
app.get('/urls/register', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };

  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const found = Object.values(users).find(user => user.email === req.body.email);
  if (!req.body.email || !req.body.password || found) {
    res.sendStatus(400);
  } else {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const new_id = generateRandomString();
    users[new_id] = {
      id: new_id,
      email: req.body.email,
      password: hashedPassword
    };
    req.session.user_id = new_id;
    res.redirect(301, '/urls');
  }
});

//  find by id
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id),
    shortURL: req.params.id
  };
  console.log(templateVars.urls);
  res.render('urls_show', templateVars);
});

//  delete given the short url id
app.delete('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(301, '/urls');
});

//  add new URL
app.post('/urls/', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    url: req.body.longURL,
    user_id: req.session.user_id
  };
  res.redirect(301, `/urls/${shortURL}`);
});

//  update URL info
app.put('/urls/:id', (req, res) => {
  console.log();
  urlDatabase[req.params.id].url = req.body.longURL;
  res.redirect(301, `/urls/${req.params.id}`);
});

//  redirect to long URL
app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].url;
  urlDatabase[req.params.shortURL].visits = ( urlDatabase[req.params.shortURL].visits)+1 || 0;
  if(!urlDatabase[req.params.shortURL].allVisits){
    urlDatabase[req.params.shortURL].allVisits = [];
  }
  console.log(users[req.session.user_id]);
  urlDatabase[req.params.shortURL].allVisits.unshift({
    user_id : getUserID(users[req.session.user_id]),
    date : getDate()
  });

  res.redirect(urlDatabase[req.params.shortURL].url);
});

app.listen(PORT, () => {
  console.log(`Tiny App listening on port ${PORT}!`);
});

function generateRandomString() {
  let random = Math.random()
    .toString(36) //
    .substring(7);
  return random;
}

function getDate(){
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;

  return dateTime;
}

function getUserID(userID){
  if(userID){
    return userID.id;
  }
  else{
    return generateRandomString();
  }
}