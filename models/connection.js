const sequelize = require('sequelize');
const config = require('../config/db');

var db = config.data

var con = new sequelize(db.database, db.username, db.password, {
    host : db.host,
    dialect : 'mysql',
    logging : false
});

con.authenticate()
.then(()=>{
    console.log('connection established')
}).catch((error)=>{
    console.log('connection not established'+error)
});
module.exports = con 
