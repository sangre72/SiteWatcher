const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./User');

class Authentication {
    constructor() {
        this.initialize = this.initialize.bind(this);
        this.authenticate = this.authenticate.bind(this);
        this.setupLocalStrategy();
    }

    setupLocalStrategy() {
        passport.use(new LocalStrategy(this.verifyUser));
    }

    async verifyUser(username, password, done) {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (!await user.verifyPassword(password)) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }

    initialize() {
        return passport.initialize();
    }

    authenticate() {
        return passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true
        });
    }
}

module.exports = new Authentication();
