const jwt = require('jsonwebtoken');

const secret = 'zqzySWsQi8Drrdy/ahUmpF3/gmscdVqiaki0ZS8ASLygt1uCbVoAYGZBGcFPjYXwJaqK4i+yCHCypQxN3XaHQQ==';
const payload = {
  role: 'ops_automation',
  iss: 'n8n',
  sub: '11111111-1111-1111-1111-111111111111'
};

const token = jwt.sign(payload, secret, {
  algorithm: 'HS256',
  expiresIn: '365d'
});

console.log(token);
