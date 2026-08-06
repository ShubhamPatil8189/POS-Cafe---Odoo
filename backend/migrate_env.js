const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
const vars = {};
lines.forEach(l => {
  const match = l.match(/^([^=]+)=(.*)$/);
  if (match) vars[match[1]] = match[2];
});
const password = vars.DB_PASSWORD || vars.DB_password;
const url = `mysql://${vars.DB_USER}:${password}@${vars.DB_HOST}:${vars.DB_PORT || 3306}/${vars.DB_NAME}${vars.DB_SSL === 'true' ? '?sslaccept=strict' : ''}`;
if (!env.includes('DATABASE_URL')) {
  fs.appendFileSync('.env', `\nDATABASE_URL='${url}'\n`);
  console.log('Added DATABASE_URL');
}
