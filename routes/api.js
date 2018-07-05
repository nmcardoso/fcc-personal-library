/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const CONN_STR = process.env.DB;
//Example connection: MongoClient.connect(CONN_STR, function(err, db) {});

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      MongoClient.connect(CONN_STR, (err, db) => {
        if (err) throw err;
        
        db.collection('books').aggregate([
          {
            $project: {
              title: 1,
              commentcount: { $size: '$comments' }
            }
          }
        ], (err, r) => {
          if (err) throw err;
          
          res.json(r);
          db.close();
        });
      });
    })
    
    .post(function (req, res){
      if (!req.body.title)
        return res.status(200)
                  .type('text')
                  .send('no title given');
    
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
      
      MongoClient.connect(CONN_STR, (err, db) => {
        if (err) throw err;
        
        db.collection('books').insertOne({
          _id: new ObjectId, 
          title: title,
          comments: []
        }, (err, r) => {
          if (err) throw err;
          
          console.log('insertedId: ' + r.insertedId);
          console.log('_id: ' + r.ops[0]._id);
          
          if (r.insertedCount === 1) {
            res.json({
              _id: r.insertedId,
              title: r.ops[0].title,
              commentcount: r.ops[0].comments.length
            });
          }
          
          db.close();
        });
      });
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
    
      MongoClient.connect(CONN_STR, (err, db) => {
        if (err) throw err;
        
        db.collection('books').deleteMany({}, (err, r) => {
          if (err) throw err;
          
          if (r.result.ok == 1) {
            res.status(200)
               .type('text')
               .send('complete delete successful');
          }
          
          db.close();
        })
      })
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    
      let objId;
      try {
        objId = ObjectId(bookid);
      } catch(e) {
        return res.status(200)
                  .type('text')
                  .send('book not found');
      }
    
      MongoClient.connect(CONN_STR, (err, db) => {
        if (err) throw err;
        
        db.collection('books').findOne({_id: ObjectId(bookid)}, (err, r) => {
          if (err) throw err;
          
          if (r)
            res.json(r);
          else
            res.status(200)
               .type('text')
               .send('book not found');
            
          db.close();
        });
      })
    })
    
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get
      
      MongoClient.connect(CONN_STR, (err, db) => {
        if (err) throw err;
        
        db.collection('books').findOneAndUpdate(
          { _id: ObjectId(bookid) }, 
          {
            $push: { comments: comment }
          },
          (err, r) => {
            if (err) throw err;
            
            if (r.ok == 1)
              res.json(r.value);
            else
              console.log(r.lasrErrorObject);
            
            db.close();
          }
        );
      })
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
      
      MongoClient.connect(CONN_STR, (err, db) => {
        db.collection('books').deleteOne(
          { _id: ObjectId(bookid) }, 
          (err, r) => {
            if (err) throw err;
            
            if (r.deletedCount == 1)
              res.status(200)
                 .type('text')
                 .send('delete successful');
            
            db.close();
          }
        );
      });
    });
  
};
