const sequelize = require('sequelize');
const con = require('./connection');

var userSchema = con.define('sn_users',{
      email : {
            type : sequelize.STRING,
            allowNull : false
      },
      password : {
            type : sequelize.STRING,
            allowNull : false
      },
      status : {
            type : sequelize.STRING,
            defaultValue : 1
      }
});

module.exports = userSchema
