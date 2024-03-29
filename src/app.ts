import express from "express";
import compression from "compression";  // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import lusca from "lusca";
import mongo from "connect-mongo";
import flash from "express-flash";
import path from "path";
import mongoose from "mongoose";
import passport from "passport";
import bluebird from "bluebird";
import { MONGODB_URI, SESSION_SECRET } from "./util/secrets";

const MongoStore = mongo(session);

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as userController from "./controllers/user";
import * as lfgController from "./controllers/lfg";
import * as apiController from "./controllers/api";
import * as contactController from "./controllers/contact";


// API keys and Passport configuration
import * as passportConfig from "./config/passport";

// Create Express server
const app = express();

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
mongoose.Promise = bluebird;

mongoose.connect(mongoUrl, { useNewUrlParser: true} ).then(
    () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch(err => {
    console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
    // process.exit();
});

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    store: new MongoStore({
        url: mongoUrl,
        autoReconnect: true
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {

    enum Classes {
        warrior='warrior',
        paladin='paladin',
        mage='mage',
        druid='druid',
        shaman='shaman',
        warlock='warlock',
        rogue='rogue',
        priest='priest',
    }

    const realms = [
        {id: 0, name: 'Amnennar'},
        {id: 1, name: 'Ashbringer'},
        {id: 2, name: 'Auberdine'},
        {id: 3, name: 'Bloodfang'},
        {id: 4, name: 'Chromie'},
        {id: 5, name: 'Dragon\'s Call'},
        {id: 6, name: 'Dreadmist'},
        {id: 7, name: 'Everlook'},
        {id: 8, name: 'Finkle'},
        {id: 9, name: 'Firemaw'},
        {id: 10, name: 'Flamegor'},
        {id: 11, name: 'Flamelash'},
        {id: 12, name: 'Gandling'},
        {id: 13, name: 'Gehennas'},
        {id: 14, name: 'Golemagg'},
        {id: 15, name: 'Hydraxian Waterlords'},
        {id: 16, name: 'Judgement'},
        {id: 17, name: 'Lakeshire'},
        {id: 18, name: 'Lucifron'},
        {id: 19, name: 'Mirage Raceway'},
        {id: 20, name: 'Mograine'},
        {id: 21, name: 'Nethergarde Keep'},
        {id: 22, name: 'Noggenfogger'},
        {id: 23, name: 'Patchwerk'},
        {id: 24, name: 'Pyrewood Village'},
        {id: 25, name: 'Razorfen'},
        {id: 26, name: 'Razorgore'},
        {id: 27, name: 'Rhok\'delar'},
        {id: 28, name: 'Shazzrah'},
        {id: 29, name: 'Skullflame'},
        {id: 30, name: 'Stonespine'},
        {id: 31, name: 'Sulfuron'},
        {id: 32, name: 'Ten Storms'},
        {id: 33, name: 'Transcendence'},
        {id: 34, name: 'Venoxis'},
        {id: 35, name: 'Wyrmthalak'},
        {id: 36, name: 'Zandalar Tribe'},
    ];

    res.locals.classList = Classes;
    res.locals.realms = realms;

    res.locals.user = req.user;
    next();
});
app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    if (!req.user &&
    req.path !== "/login" &&
    req.path !== "/signup" &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
        req.session.returnTo = req.path;
    } else if (req.user &&
    req.path == "/account") {
        req.session.returnTo = req.path;
    }
    next();
});

app.use(
    express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);

/**
 * Primary app routes.
 */
app.get("/", homeController.index);
app.get("/lfg", lfgController.index);
app.get("/login", userController.getLogin);
app.post("/login", userController.postLogin);
app.get("/logout", userController.logout);
app.get("/forgot", userController.getForgot);
app.post("/forgot", userController.postForgot);
app.get("/reset/:token", userController.getReset);
app.post("/reset/:token", userController.postReset);
app.get("/signup", userController.getSignup);
app.post("/signup", userController.postSignup);
app.get("/contact", contactController.getContact);
app.post("/contact", contactController.postContact);
app.get("/account", passportConfig.isAuthenticated, userController.getAccount);
app.post("/account/profile", passportConfig.isAuthenticated, userController.postUpdateProfile);
app.get("/account/character/add", passportConfig.isAuthenticated, userController.getAddAccount);
app.post("/account/character/add", passportConfig.isAuthenticated, userController.postAddAccount);
app.post("/account/password", passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post("/account/delete", passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get("/account/unlink/:provider", passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get("/api", apiController.getApi);
app.get("/api/facebook", passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email", "public_profile"] }));
app.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
    res.redirect(req.session.returnTo || "/");
});

export default app;
