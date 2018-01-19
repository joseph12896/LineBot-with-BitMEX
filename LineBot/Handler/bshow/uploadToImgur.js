const fetch = require('node-fetch'),
    FormData = require('form-data');

module.exports = async function (imgBuffer) {
    try {
        const form = new FormData();
        form.append('image', imgBuffer.toString('base64'));

        let options = {
            method: 'POST',
            headers: {
                "Authorization": `Client-ID e39e7b2a997e7f3`,
            },
            body: form
        };

        let res = await fetch('https://api.imgur.com/3/image', options);
        let result = await res.json();
        if (result.success == true) {
            return ({
                link: result.data.link,
                deletehash: result.data.deletehash,
            });
        }
    } catch (e) {
         console.log('Failed to upload to imgur')
    }
}