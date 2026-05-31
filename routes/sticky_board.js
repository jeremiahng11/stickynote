const express = require('express');
const router = express.Router();

//require models
const Users = require('../models/users');
const board = require('../models/sticky_board');
const Notes = require('../models/notes');

//errorHandler Function
const errorHandler = (err, res) =>{
    console.log("Error :"+err)
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

router.post('/', (req, res)=>{
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

router.get('/:id', (req, res)=>{ 
    //findAll Notes 
    Notes.findAll({attributes:["id","note","xPos","yPos","width","height","color","boardId","visible"],where : {boardId : req.params.id}}).then((notes)=>{
        res.json({status : true, notesData : notes})
    }).catch(errorHandler);
});

router.post('/:id', async (req, res)=>{
    if(req.body.id){
         //for delete notes
        try{
            await Notes.destroy({where : {id : req.body.id}});
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
            for(let i=0; i<arr.length; i++){
                let data = JSON.parse(arr[i])
                if(data.id == 0){
                    delete data.id;            // let the DB assign the primary key
                    data.boardId = req.params.id;
                    newData.push(data)
                }else{
                    oldData.push(data)
                }
            }

            // update existing notes (await so the response reflects the real result)
            await Promise.all(oldData.map((data)=> Notes.update(data,{where : {id : data.id}})));

            // create new notes and capture their generated ids (in submission order)
            let created = [];
            if(newData.length != 0){
                created = await Notes.bulkCreate(newData);
            }

            // returning the new ids lets the client adopt them and avoid duplicate inserts
            return res.json({status : true, message :  'Notes saved successfully!!', created : created.map((c)=> c.id)})
        }catch(err){
            console.log("Error :"+err)
            return res.json({status : false, message : 'Notes not saved.'})
        }
    }
});

router.post('/boardDelete/:id',(req, res)=>{ 
    //for delete a board 
    board.destroy({where : {id : req.params.id}}).then((result)=>{                            
        res.json({status: true, message : 'board deleted.'})
    }).catch(errorHandler);
});

module.exports = router