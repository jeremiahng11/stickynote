const sequelize = require('sequelize');
const moment = require('moment');

const con = require('./connection');
const notes = require('./notes');

var board = con.define('sn_stickyboard',{
    title : {
        type : sequelize.STRING,
        allowNull : true
    },
    userId : {
        type : sequelize.INTEGER
    },
    status : {
        type : sequelize.STRING,
        defaultValue : 1
    },
    createdAt: {
        type: sequelize.DATE,
        get: function(fieldName) {
            const rawValue = this.getDataValue('createdAt');
            return moment(rawValue).format('ll');
        }
    },
    updatedAt: {
        type: sequelize.DATE,
        get: function(fieldName) {
            const rawValue = this.getDataValue('updatedAt');
            return moment(rawValue).format('ll');
        }
    }
});

board.hasMany(notes,{foreignKey : 'boardId', onDelete : 'cascade'});
notes.belongsTo(board,{foreignKey : 'boardId'});

module.exports = board
