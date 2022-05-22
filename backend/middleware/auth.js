require('dotenv').config();
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET;

const authorize = (req, res, next) => {
    console.log("Token:".blue, req.headers.token);
    jwt.verify(req.headers.token, jwtSecret, (error, decoded) => {
        if (error){
            console.log(error);
            res.status(401).json({ "message": "failure", "error": "Invalid token." });
        }
        else {
            req.userInfo = decoded;
            console.log("User info:".blue, JSON.stringify(req.userInfo));
            next();
        }
    });
}

module.exports = authorize;
