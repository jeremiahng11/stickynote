const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();

//require models
const Users = require('../models/users');
const board = require('../models/sticky_board');
const Notes = require('../models/notes');

//errorHandler Function
const errorHandler = (err, res) =>{
    console.log("Error :"+err)
}

// Require an authenticated session for API routes (returns 401 JSON).
const requireAuth = (req, res, next) =>{
    if(!req.session || !req.session.Id){
        return res.status(401).json({status : false, message : 'Not authenticated.'})
    }
    next();
}

// Load the board for :id and confirm it belongs to the logged-in user.
// Prevents one user from reading/modifying another user's board (IDOR).
const loadOwnedBoard = (req, res, next) =>{
    board.findOne({where : {id : req.params.id, userId : req.session.Id}}).then((found)=>{
        if(!found){
            return res.status(403).json({status : false, message : 'Board not found or not yours.'})
        }
        req.board = found;
        next();
    }).catch((err)=>{
        console.log("Error :"+err)
        res.status(500).json({status : false, message : 'Server error.'})
    });
}

router.get('/', (req, res)=>{
    if(req.session.Id){
        //Here you will find user who loggedIn
        Users.findOne({where : {id : req.session.Id}}).then((users)=>{
            //session points to a user that no longer exists -> send back to login
            if(!users){
                req.session.destroy(()=>{});
                return res.redirect('/');
            }
            //findAll stickyBoard which is loggedIn user created
            board.findAll({where : {userId : users.id},order : [['id' , 'DESC']], include: [{ model: Notes, attributes: ['id','note']}]
            }).then((boardData) =>{
                res.render('index',{board : boardData})
            }).catch((err)=>{
                console.log("Error :"+err)
                res.status(500).send('Something went wrong loading your boards.')
            });
        }).catch((err)=>{
            console.log("Error :"+err)
            res.status(500).send('Something went wrong loading your boards.')
        });
    }else{
        res.redirect('/');
    }
});

router.post('/', requireAuth, (req, res)=>{
    var title = req.body.title
    var userId = req.session.Id
    if(title==''){
        res.json({status: false, message : 'Board name cannot be empty.'})
    }else{
        // find board is exists or not
        board.findOne({where : {title : title,userId : userId}}).then((result)=>{ 
            if(result){
                res.json({status: false, message : 'Board name already exists....try another name.'})
            }else{
                // create board
                board.create({title : title,userId : userId}).then((newData)=>{                    
                    res.json({status: true, message : 'Board created successfully!!', data : newData})
                }).catch((err)=>{
                    res.json({status: false, message : 'Board not created.'})
                });
            }
        }).catch((err)=>{
            res.json({status: false, message : 'Board not created.'})
        });  
    }
});

router.get('/:id', requireAuth, loadOwnedBoard, (req, res)=>{
    //findAll Notes
    Notes.findAll({attributes:["id","note","xPos","yPos","width","height","color","boardId","visible"],where : {boardId : req.params.id, id : {[Op.gt] : 0}}}).then((notes)=>{
        res.json({status : true, notesData : notes})
    }).catch(errorHandler);
});

router.post('/:id', requireAuth, loadOwnedBoard, async (req, res)=>{
    if(req.body.id){
         //for delete notes
        try{
            // scope the delete to this (owned) board so a note id from another
            // board can't be deleted
            await Notes.destroy({where : {id : req.body.id, boardId : req.params.id}});
            return res.json({status : true, message : 'Note deleted successfully!!'})
        }catch(err){
            console.log("Error :"+err)
            return res.json({status: false, message : 'Note not deleted.'})
        }
    }else{
        try{
            var arr = JSON.parse(req.body.data)
            var newData = [];
            var oldData = [];
            // only these columns exist on the notes table; ignore anything else
            const allowed = ['note','color','xPos','yPos','width','height','visible','boardId'];
            const pick = (src)=>{
                const out = {};
                allowed.forEach((k)=>{ if(typeof src[k] !== 'undefined'){ out[k] = src[k]; } });
                return out;
            };
            for(let i=0; i<arr.length; i++){
                let data;
                try{
                    data = JSON.parse(arr[i])
                }catch(e){
                    // skip a single malformed note rather than failing the whole board
                    console.log('Skipping malformed note payload:', e.message)
                    continue;
                }
                // treat missing / 0 / null id as a brand new note
                if(!data.id || data.id == 0){
                    let row = pick(data);
                    row.boardId = req.params.id;
                    // keep the client id (cid) alongside; it is not a DB column
                    newData.push({ cid: data.cid, values: row })
                }else{
                    oldData.push({ id: data.id, values: pick(data) })
                }
            }

            // update existing notes, scoped to this board so a forged id from
            // another board can't be modified
            await Promise.all(oldData.map((o)=> Notes.update(o.values,{where : {id : o.id, boardId : req.params.id}})));

            // create new notes one by one so we reliably get each generated id
            // (bulkCreate does not return autoincrement ids on all MySQL setups,
            // which caused the client to re-create notes -> duplicates)
            let created = [];
            for(let n=0; n<newData.length; n++){
                const row = await Notes.create(newData[n].values);
                created.push({ cid: newData[n].cid, id: row.id });
            }

            // returning {cid, id} lets the client match each new note back by its
            // client id and adopt the real id, preventing duplicate inserts
            return res.json({status : true, message :  'Notes saved successfully!!', created : created})
        }catch(err){
            console.log('Notes save error:', err && err.stack ? err.stack : err)
            return res.json({status : false, message : 'Notes not saved.', error : (err && err.message) ? err.message : String(err)})
        }
    }
});

router.post('/boardDelete/:id', requireAuth, (req, res)=>{
    // only the owner can delete their board (cascades to its notes)
    board.destroy({where : {id : req.params.id, userId : req.session.Id}}).then((count)=>{
        if(!count){
            return res.status(403).json({status: false, message : 'Board not found or not yours.'})
        }
        res.json({status: true, message : 'board deleted.'})
    }).catch((err)=>{
        console.log("Error :"+err)
        res.status(500).json({status: false, message : 'Board not deleted.'})
    });
});

module.exports = router