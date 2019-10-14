const _ = require('lodash');
const fetch = require('node-fetch');
const fs = require('fs');

const PROXY_LIST_TXT = fs.readFileSync(require.resolve('./proxy-list.txt')).toString();
const PROXY_LIST = PROXY_LIST_TXT.trim().split('\n');

const sequentialOr = pfs =>
  pfs.reduce((p, pf) => p.catch(pf), Promise.reject());

const fetchTextViaProxyList = async (url, options={}) => {
  const _url = encodeURIComponent(url);
  const _options = encodeURIComponent(JSON.stringify(options));
  const query = `url=${_url}&options=${_options}`;

  const requests = _.shuffle(PROXY_LIST).map(baseUrl => async () => {
    const resp = await fetch(`${baseUrl}?${query}`);
    const { status, content } = await resp.json();
    if (status !== 'success') {
      throw new Error(content);
    }
    return content;
  });

  return sequentialOr(requests);
}

module.exports = fetchTextViaProxyList;
