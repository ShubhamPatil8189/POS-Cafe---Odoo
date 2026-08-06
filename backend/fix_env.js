const fs = require('fs');
let env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
const vars = {};
lines.forEach(l => {
  const match = l.match(/^([^=]+)=(.*)$/);
  if (match) vars[match[1]] = match[2];
});
const password = vars.DB_PASSWORD || vars.DB_password;
const url = `mysql://${vars.DB_USER}:${password}@${vars.DB_HOST}:${vars.DB_PORT || 3306}/${vars.DB_NAME}${vars.DB_SSL === 'true' ? '?sslaccept=strict' : ''}`;

env = env.replace(/DATABASE_URL=.*(\r?\n|$)/g, '');
env += `\nDATABASE_URL='${url}'\n`;
fs.writeFileSync('.env', env);
console.log('Fixed DATABASE_URL');
