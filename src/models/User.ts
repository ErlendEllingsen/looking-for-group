import bcrypt from "bcrypt-nodejs";
import crypto from "crypto";
import mongoose from "mongoose";

export type UserDocument = mongoose.Document & {
    email: string;
    password: string;
    passwordResetToken: string;
    passwordResetExpires: Date;

    facebook: string;
    tokens: AuthToken[];

    characters: GameCharacter[];

    comparePassword: comparePasswordFunction;
    gravatar: (size: number) => string;
};

type comparePasswordFunction = (candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void;

export interface AuthToken {
    accessToken: string;
    kind: string;
}

export interface GameCharacter {
    realm: string;
    name: string;
    faction: string;
    className: string;
    role: string;
    level: number;
}

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, },
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,

    facebook: String,
    twitter: String,
    google: String,
    tokens: Array,

    primaryCharacter: String, // points to name in characters array
    characters: [{
        realm: { type: String, unique: false, index: true},
        name: String,
        faction: { type: String, unique: false, index: true},
        className: { type: String, unique: false, index: true},
        role: { type: String, unique: false, index: true},
        level: { type: Number, unique: false, index: true}
    }],

}, { timestamps: true });

/**
 * Password hash middleware.
 */
userSchema.pre("save", function save(next) {
    const user = this as UserDocument;
    if (!user.isModified("password")) { return next(); }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) { return next(err); }
        bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
            if (err) { return next(err); }
            user.password = hash;
            next();
        });
    });
});

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
        cb(err, isMatch);
    });
};

userSchema.methods.comparePassword = comparePassword;

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function (size: number = 200) {
    if (!this.email) {
        return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto.createHash("md5").update(this.email).digest("hex");
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

userSchema.methods.getPrimaryCharacter = function() {
    return this.characters.find((el: any) => {
        return el.name === this.primaryCharacter;
    });
};

userSchema.methods.classIcon = function() {
    const char = this.getPrimaryCharacter(); 
    const classFile = (char ? char.className : 'egg');
    return `/images/profileicons/${classFile}.png`;
};

export const User = mongoose.model<UserDocument>("User", userSchema);
