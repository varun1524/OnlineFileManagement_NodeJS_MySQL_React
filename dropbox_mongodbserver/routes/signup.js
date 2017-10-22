express = require('express');
var router = express.Router();
var fs = require('fs');
var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/dropbox";
var act = require('./activity');
var bcrypt = require('bcrypt');


/* GET Sign Up Page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.post('/doSignUp', function(req, res, next){
    try {
        console.log(req.body);

        var salt = bcrypt.genSaltSync(10);

        var data ={
            _id : req.body.username,
            firstname : req.body.firstname,
            lastname : req.body.lastname,
            username : req.body.username,
            hashpassword : bcrypt.hashSync(req.body.password, salt)
        };

        mongo.connect(mongoURL, function () {
            var usercollection = mongo.collection('users');
            usercollection.findOne({username:data._id}, function(err, result) {
                if(err){
                    console.log(err);
                    throw err;
                }
                if(result!==null) {
                    if (result._id === data.username) {
                        console.log(result._id);
                        res.status(301).send({"message": "Already Exist"});
                    }
                    else {
                        console.log(result.username);
                        res.status(401).send({"message": "Error while Signing Up"});
                    }
                }
                else {
                    usercollection.insertOne(data, function (err, result1) {
                        console.log(result1);
                        console.log(result1.insertedCount);
                        if (result1.insertedCount === 1) {
                            console.log("Sign up successful");
                            let userprofilecollection = mongo.collection("userprofile");
                            let profiledata = {
                                overview : "",
                                work: "",
                                education: "",
                                contactinfo: "",
                                lifeevents: "",
                                music: false,
                                sports: false,
                                reading: false,
                                _id : data.username
                            };
                            userprofilecollection.insertOne(profiledata ,function (err, result2) {
                                console.log(result2);
                                if(err){
                                    console.log(err);
                                    throw "Error while adding data into userprofile table";
                                }
                                act.insertIntoActivity(function (err, activityInserted) {
                                    if(err){
                                        console.log(err);
                                        res.status(301).json({message: "Signup Successful. Failed to add user activity"});
                                    }
                                    console.log(activityInserted);
                                    if(activityInserted){
                                        createUserDirectory(data.username);
                                        res.status(201).send({"message": "Signup Successful"});
                                    }
                                    else {
                                        usercollection.deleteOne({_id: data.username},function (err, result3) {
                                            console.log(result3);
                                            userprofilecollection.deleteOne({_id:data.username}, function (err, result4) {
                                                console.log(result4);
                                                //delete directory here
                                                res.status(401).send({"message": "Signup Failed"});
                                            })
                                        })

                                    }
                                },data.username, "signup");
                            });
                        }
                    });
                }
            });
        });
        // mysql.fetchData(function (err,results) {
        //     console.log(results);
        //     console.log(results.length);
        //     if(err){
        //         throw err;
        //     }
        //     else
        //     {
        //         if(results.length===1){
        //             console.log("User Exists");
        //             res.status(301).json({message: "username already exist"})
        //         }
        //         else{
        //
        //             var salt = bcrypt.genSaltSync(10);
        //
        //             var hash = bcrypt.hashSync(data.password, salt);
        //
        //             console.log(salt);
        //             console.log(hash);
        //
        //             var insertUser="insert into users (username,firstname,lastname,hashpassword, salt) " +
        //                 "values('"+data.username+"','"+data.firstname+"','"+data.lastname+"','"+hash+"','"+salt+"');";
        //             console.log("Insert Query : " + insertUser);
        //             //var insertUser="insert into users (username, firstname, lastname, password, address) values('varun@yahoo.com','varun','shah','varun123','1246 alameda')";
        //
        //             mysql.insertData(function(err,results){
        //                 console.log(results);
        //                 if(err){
        //                     throw err;
        //                 }
        //                 else
        //                 {
        //                     console.log("Affected Rows: "+results.affectedRows);
        //                     console.log(results);
        //                     if(results.affectedRows === 1){
        //                         console.log("Sign up successful");
        //                         insertUser="insert into userprofile (overview,work,education,contactinfo, lifeevents, music, sports, reading, username) " +
        //                             "values('','','','','',false,false,false,'"+ data.username +"');";
        //                         mysql.insertData(function (err, result2) {
        //                             console.log(result2);
        //                             if(err){
        //                                 console.log(err);
        //                                 throw "Error while adding data into userprofile table";
        //                             }
        //                             // act.insertIntoActivity(function (err, results3) {
        //                             //     if(err){
        //                             //         console.log(err);
        //                             //         res.status(301).json({message: "Signup Successful. Failed to add user activity"});
        //                             //     }
        //                             //     console.log(results3);
        //                                 res.status(201).json({message: "Signup successful"});
        //                             //     createUserDirectory(data.username);
        //                             // },data.username, "signup");
        //                         },insertUser);
        //                     }
        //                     else {
        //                         console.log("Error while inserting data into database");
        //                         res.status(401).json({message: "Signup Failed"});
        //                     }
        //                 }
        //             },insertUser);
        //         }
        //     }
        // }, fetchUser);
    }
    catch (e){
        console.log(e);
        res.status(401).json({message: "Signup Failed"});
    }
});

function createUserDirectory(user){
    try {
        if(fs.existsSync('./dropboxstorage')){
            var userdirpath="./dropboxstorage/" + user;
            console.log(userdirpath);
            var userPath = fs.mkdir(userdirpath);
            console.log(userPath);
        }
        else{
            console.log("dropboxstorage does not exist");
        }
    }
    catch(e) {
        throw e;
    }
}



module.exports = router;