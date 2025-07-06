// const fs = require('fs').promises;

// const fs = require('fs');

// async function getTokens() {
//     const tokensFile = JSON.parse(fs.readFileSync('./tokens.json', 'utf8'));
//     return tokensFile;
// }

// (async () => {
//     const tokens = await getTokens();
//     console.log(tokens); // доступ к объекту

//     const { ['x-token']: XTOKEN,
//          ['x-request-id']: XREQUESTID 
//         } = tokens;
//     console.log(XTOKEN,  XREQUESTID)
//     return { XTOKEN, XREQUESTID }

// })();

// mpdule.exports = getTokens();

const fs = require('fs');

function getTokens() {
    const tokens = JSON.parse(fs.readFileSync('./tokens.json', 'utf8'));
    const {
        ['x-token']: XTOKEN,
        ['x-request-id']: XREQUESTID
    } = tokens;

    return { XTOKEN, XREQUESTID };
}

module.exports = getTokens;