const fs = require('fs');
const bodyParser = require('body-parser');
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'ksa8fensake';
const expiresIn = '1h';

const server = jsonServer.create();
const router = jsonServer.router('./db.json')

const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))

server.use(jsonServer.defaults());

server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json());

function createToken(payload){
    return jwt.sign(payload, SECRET_KEY, {expiresIn})
}

// Verify the token 
function verifyToken(token){
    return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
}

// Check if the user exists in database
function isAuthenticated({email, password}){
    return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1
}

server.post('/auth/login', (req, res) => {
    const {email, password} = req.body
    if (isAuthenticated({email, password}) === false) {
      const status = 401
      const message = 'Incorrect email or password'
      res.status(status).json({status, message})
      return
    }
    const access_token = createToken({email, password})
    res.status(200).json({access_token})
})

server.post('/auth/signup', (req, res) => {
    console.log(req.body)
    const { email }  = req.body;
    const access_token = createToken({ email });
    userdb.users.push(req.body);
    const message = 'Account created';
    res.status(200).json({message, email, access_token});
})
server.use(/^(?!\/auth).*$/,  (req, res, next) => {
if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Bad authorization header'
    res.status(status).json({status, message})
    return
}
try {
    verifyToken(req.headers.authorization.split(' ')[1])
    next()
} catch (err) {
    const status = 401
    const message = 'Error: access_token is not valid'
    res.status(status).json({status, message})
}
})
server.use(router);

server.listen(3000, () => {
    console.log('Run Auth API Server')
});