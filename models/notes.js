const sequelize = require('sequelize');
const con = require('./connection');

var notes = con.define('sn_notes',{
    note : {
        type : sequelize.TEXT,
        allowNull : true
    },
    color : {
        type : sequelize.STRING 
    },
    xPos : {
        type : sequelize.STRING,
        allowNull : false 
    },
    yPos : {
        type : sequelize.STRING,
        allowNull : false 
    },
    visible : {
        type : sequelize.STRING,
        defaultValue : 1
    }
});

con.sync()
.then(()=>{
    console.log('table created')
}).catch((err)=>{
    console.log(err)
    console.log('table not created')
});

module.exports = notes
