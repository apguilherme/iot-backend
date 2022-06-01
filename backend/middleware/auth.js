require('dotenv').config();
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET;

const authorize = (req, res, next) => {
    try {
        console.log("Token:".blue, req.headers.token);
        if (req.headers.token == null) {
            throw new Error(`No token provided: ${req.headers.token}`);
        }
        else {
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
    } catch (error) {
        console.log("Token error at auth.js:".red, error);
    }
}

module.exports = authorize;
