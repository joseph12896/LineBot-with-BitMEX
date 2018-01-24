const querystring = require('querystring'),
    path = require('path'),
    fs = require('fs'),
    fetch = require("node-fetch")
    , moment = require("moment"),
    url = require('url');

class LineLogin {

    constructor({ channel_id, channel_secret, callback_url }) {
        this.channel_id = channel_id;
        this.channel_secret = channel_secret;
        this.callback_url = callback_url;
    }

    /**
     * Logout user
     */
    async logoutUser(token) {
        try {
            let postData = querystring.stringify({
                access_token: token,
                client_id: this.channel_id,
                client_secret: this.channel_secret,
            });

            let result = await fetch('https://api.line.me/oauth2/v2.1/revoke', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: postData
            });

            if (result.ok) return true;
        } catch (e) {
            console.log(e)
        }
        return false;
    }

    /**
     * Getting user profiles
     */
    async getUserProfile(token) {
        try {
            if (await this.verifyAccessToken(token)) {
                let result = await fetch('https://api.line.me/v2/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (result.ok) {
                    // {
                    //     "userId":"U4af4980629...",
                    //     "displayName":"Brown",
                    //     "pictureUrl":"https://example.com/abcdefghijklmn",
                    //     "statusMessage":"Hello, LINE!"
                    //   }
                    return await result.json();
                }
            }
            return false;
        } catch (e) {
            console.log(e)
        }
    }

    /**
     * Verifying access tokens
     */
    async verifyAccessToken(token) {
        try {
            let result = await fetch(
                url.format({
                    pathname: 'https://api.line.me/oauth2/v2.1/verify',
                    query: {
                        access_token: token
                    }
                }));

            result = await result.json();
            if (result.error) return false;
            return true;
        } catch (e) {
            console.log(e)
        }
    }

    /**
     * getAccessToken
     */
    async getAccessToken(code) {
        try {
            let postData = querystring.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.callback_url,
                client_id: this.channel_id,
                client_secret: this.channel_secret,
            });

            let result = await fetch('https://api.line.me/oauth2/v2.1/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: postData
            });

            // result
            // {
            //     "access_token": "bNl4YEFPI/hjFWhTqexp4MuEw5YPs...",
            //     "expires_in": 2592000,
            //     "id_token": "eyJhbGciOiJIUzI1NiJ9...", // This field is returned only if openid is specified in the scope.
            //     "refresh_token": "Aa1FdeggRhTnPNNpxr8p",
            //     "scope": "profile",
            //     "token_type": "Bearer"
            // }
            return (await result.json()).access_token;
        } catch (e) {
            console.log(e)
        }

    }
}

module.exports = LineLogin;

