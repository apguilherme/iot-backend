require('dotenv').config();
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET;

const authorize = (req, res, next) => {
    console.log(`>>> token: ${req.headers.token}`.blue);
    jwt.verify(req.headers.token, jwtSecret, (error, decoded) => {
        if (error){
            console.log(error);
            res.status(401).json({ "message": "failure", "error": "Invalid token." });
        }
        else {
            req.userInfo = decoded;
            console.log(`>>> userInfo: ${JSON.stringify(req.userInfo)}`.yellow);
            next();
        }
    });
}

module.exports = authorize;
