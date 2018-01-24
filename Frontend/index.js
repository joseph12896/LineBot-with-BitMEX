const express = require('express'),
    router = express.Router(),
    path = require('path'),
    fs = require('fs'),
    Person = require(SCHEMA_PATH).Person,
    fetch = require("node-fetch"),
    moment = require("moment"),
    url = require('url'),
    LineLogin = require('./LineLogin');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
router.use(cookieParser());
router.use(bodyParser.json());
// const cors = require('cors')
// router.use(cors());
router.use(express.static(path.resolve(__dirname,'./public')));

module.exports = router;

/**
 * Line login object
 */
const linelogin = new LineLogin({
    channel_id: process.env.line_login_channel_id,
    channel_secret: process.env.line_login_channel_secret,
    callback_url: url.resolve(process.env.APP_DOMAIN, '/frontend/callback'),
});

/**
 * Default 
 */
router.get('/', async function (req, res, next) {
    try {
        if (await linelogin.verifyAccessToken(req.cookies.accessToken)) {
            // token有效，載入主頁
            // let userInfo = await linelogin.getUserProfile(req.cookies.accessToken)
            // res.json(userInfo);
            res.status(200).sendFile(path.resolve(__dirname, './public/main.html'));
        } else {
            res.status(200).send(`<script>
            alert('Please login');
            window.location = "${url.resolve(process.env.APP_DOMAIN, '/frontend/login')}"
            </script>`);
        }
    } catch (e) {
        console.log(e)
    }
})

/**
 * logout
 */
router.get('/logout', async function (req, res) {
    if (req.cookies.accessToken) linelogin.logoutUser(req.cookies.accessToken);
    res.clearCookie('accessToken').redirect(url.resolve(process.env.APP_DOMAIN, '/frontend/'))
})

/**
 * login - 導向line longin取得code(取得accesstoken用)
 */
router.get('/login', async function (req, res, next) {
    res.redirect(
        url.format({
            pathname: "https://access.line.me/oauth2/v2.1/authorize",
            query: {
                response_type: 'code',
                client_id: linelogin.channel_id,
                redirect_uri: linelogin.callback_url,
                scope: "openid profile",
                prompt: "consent",
                state: moment().unix()
            }
        })
    )
})

/**
 * callback - 用code取得accessToken存到client端cookie，並重新導向主頁
 */
router.get('/callback', async function (req, res, next) {

    let code = req.query.code,
        state = req.query.state,
        error = req.query.error,
        error_description = req.query.error_description;

    if (code && state) {
        try {
            let accessToken = await linelogin.getAccessToken(code);
            if (accessToken) {
                res.cookie('accessToken',
                    accessToken,
                    {
                        expires: moment().add(1, 'days').toDate(),
                        httpOnly: true
                    }
                );
                return res.redirect(301, url.resolve(process.env.APP_DOMAIN, '/frontend/'));
            }
        } catch (e) {
            console.log(e)
        }
    } else if (error) {
        return res.status(500).send(error_description);
    }

    res.status(500).send('Unknown error');
});

/**
 * data - 依據userId取得(GET)或更新資料(POST)
 */
router.route('/data')
    .all(async function (req, res, next) {
        try {
            // 驗證token的有效性
            if (await linelogin.verifyAccessToken(req.cookies.accessToken)) {
                req.accessToken = req.cookies.accessToken;
                // 取得user profile
                req.userProfile = await linelogin.getUserProfile(req.cookies.accessToken);
                if (req.userProfile) {
                    // 用profile.userId尋找資料庫內使用者的資料
                    let setting = await Person.findOne({ "line.userId": req.userProfile.userId }).exec();
                    if (!setting) {
                        // 不存在，創立新資料
                        setting = await new Person({
                            line: {
                                userId: req.userProfile.userId,
                                displayName: req.userProfile.displayName,
                                pictureUrl: req.userProfile.pictureUrl,
                            },
                        }).save();
                    }
                    req.setting = setting;
                }
            }
        } catch (error) {
            console.log(error)
        }
        next();
    })
    .get(async function (req, res) {
        try {
            if (req.setting) {
                return res.json(req.setting);
            }
            return res.json({ error: 'Cannot get user settings.' });
        } catch (e) {
            console.log(e)
        }
    }).post(async function (req, res) {
        try {
            if (req.setting) {
                // ----(ignore) validate data----
                // find and update
                await Person.findOneAndUpdate({ "line.userId": req.userProfile.userId }, req.body).exec();
                let newSetting = await Person.findOne({ "line.userId": req.userProfile.userId }).exec();
                return res.json(newSetting);
            }
            return res.json({ error: 'Cannot get user settings.' });
        } catch (e) {
            console.log(e)
        }
    });