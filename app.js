const express = require('express')
const mysql = require('mysql')
const path = require('path')
const ejsMate = require('ejs-mate')
const methodOverride = require("method-override")
const ejs = require("ejs")
const pdf = require("html-pdf");

//create connection 

const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'complaint_management'  // used when it is alreay present if not then can use route app.get('/createdb)
  });

db.connect((err)=>{
    if(err)
    throw err;

    
    console.log("Mysql Connected!...")
})

const app = express()


app.engine("ejs", ejsMate)
app.set("view engine","ejs")
app.set("views",path.join(__dirname, "views"))

app.use(express.urlencoded({ extended: true}))
app.use(methodOverride("_method"))
app.use(express.static(path.join(__dirname,"public")))

// one time use to create database
app.get('/createdb',(req,res)=>{
    let sql = 'CREATE DATABASE complaint_management'
    db.query(sql,(err,result)=>{
        if(err) throw err;
       console.log(result)
        res.send('database created...');
    })
})

// create table
app.get('/createpoststable',(req,res) => {
   //for faculty
    // let sql = 'CREATE TABLE faculty(Fname VARCHAR(255),Lname VARCHAR(255),Gender VARCHAR(10),Category VARCHAR(20),Department VARCHAR(30),Emp_ID int,Designation VARCHAR(30),Email_Id VARCHAR(50),Mobile_no int,PRIMARY KEY (Emp_ID))'
   // for admin
  // let sql = 'CREATE TABLE admin(Username VARCHAR(255),Password VARCHAR(255),PRIMARY KEY (Username))'
   // for complaint of students
//    let sql = 'CREATE TABLE complaint_students(Enrollment_No int,Type_of_Complaint VARCHAR(40),Complaint_Details VARCHAR(255),FOREIGN KEY (Enrollment_No) REFERENCES students(Enrollment_No))'
    
// for comaplaint of faculty 
let sql = 'CREATE TABLE complaint_faculty(Emp_ID int,Type_of_Complaint VARCHAR(40),Complaint_Details VARCHAR(255),FOREIGN KEY (Emp_ID) REFERENCES faculty(Emp_ID))'
db.query(sql,(err,result) => {
        if(err) throw err
        console.log(result)
        res.send('Posts table created...')
    })
})


app.get("/",(req,res)=>{
    res.render("home")
})

app.get("/student/signup",(req,res)=>{
    res.render("student_signup")
})

app.get("/faculty/signup",(req,res)=>{
    res.render("faculty_signup")
})
app.get("/faculty/login",(req,res)=>{
    res.render("login_faculty")
})

app.get("/student/login",(req,res)=>{
    res.render("login_student")
})

app.get("/admin/login",(req,res)=>{
    res.render("login_admin")
})

app.get("/student/:id",(req,res)=>{
    //res.send("so you entered faculty")
    const user = req.params.id
//console.log(user)
    let sql= `SELECT * FROM students NATURAL JOIN complaint_students WHERE Enrollment_No = "${user}"`
    db.query(sql,(err,answer1) => {
        if(err) throw err
       
        res.render("student_view",{answer1,user})
      
    })
})

app.post("/student/complaints/:id",(req,res)=>{
    const user = req.params.id
    console.log(req.body)
    let sql = `INSERT INTO complaint_students (Enrollment_No,Type_of_Complaint,Complaint_Details,status) VALUES ("${user}","${req.body.toc}","${req.body.cd}","Not Resolved")`
    db.query(sql,(err,answer1) => {
        if(err) throw err
       
              
    })
    res.redirect(`/student/${user}`)
})


app.post("/student",(req,res)=>{
    let id = req.body.id
    let password = req.body.password
    
    let sql = `SELECT * FROM students WHERE Enrollment_No="${id}" AND password="${password}"`
    db.query(sql,(err,result) => {
        if(err)  throw err
        
        else
        {
           
            if(result.length>0)
            {
                res.redirect(`/student/${id}`)
            //res.send("you are verified student")
            }
            else
            {
                res.render("error_student_login")
              res.send("Invalid credentials")
            }
            
        }
    })
})

app.get("/faculty/:id",(req,res)=>{
    //res.send("so you entered faculty")
    const user = req.params.id
//console.log(user)
    let sql= `SELECT * FROM faculty NATURAL JOIN complaint_faculty WHERE Emp_ID = "${user}"`
    db.query(sql,(err,answer1) => {
        if(err) throw err
       
        res.render("faculty_view",{answer1,user})
      
    })
})
  
app.post("/faculty/complaints/:id",(req,res)=>{
    const user = req.params.id
    console.log(req.body)
    let sql = `INSERT INTO complaint_faculty (Emp_ID,Type_of_Complaint,Complaint_Details,status) VALUES ("${user}","${req.body.toc}","${req.body.cd}","Not Resolved")`
    db.query(sql,(err,answer1) => {
        if(err) throw err
       
              
    })
    res.redirect(`/faculty/${user}`)
})



app.post("/faculty",(req,res)=>{
    console.log(req.body)
    let id = req.body.id
    let password = req.body.password
    
    let sql = `SELECT * FROM faculty WHERE Emp_ID="${id}" AND password="${password}"`
    db.query(sql,(err,result) => {
        if(err)  throw err
        
        else
        {
           console.log(result)
            if(result.length>0)
            {
           // res.send("you are verified faculty")
           res.redirect(`/faculty/${id}`)
            }
            else
            {
                res.render("error_faculty_login")
              //res.send("Invalid credentials")
            }
            
        }
    })
})
app.get("/admin/:user",(req,res)=>{
  //  console.log(req.params.user)
   const result = req.params.user

    res.render("admin_view",{result})
     
})


app.get("/admin/:user/student_complaints",(req,res)=>{
    const user = req.params.user
    let sql = `SELECT * FROM students NATURAL JOIN complaint_students`
    db.query(sql,(err,answer1) => {
            if(err) throw err
           
           
            res.render("admin_students_complaints",{answer1,user})
        })

})

app.get("/admin/:user/pdf/student_complaints",(req,res)=>{
    const user = req.params.user
    let sql = `SELECT * FROM students NATURAL JOIN complaint_students`

    db.query(sql,(err,answer1) => {
        if(err) throw err
       
       let dataload = [];
       for(let i=0;i<answer1.length;i++)
       {
           dataload.push(answer1[i]);
       }

       console.log(dataload);
       ejs.renderFile( path.join(__dirname, './views/', "report-template-student.ejs"), {dataload: dataload}, (err, data) => {
        if (err) {
              res.send(err);
        } else {
            let options = {
                "height": "11.25in",
                "width": "8.5in",
                "header": {
                    "height": "20mm"
                },
                "footer": {
                    "height": "20mm",
                },
            };
            pdf.create(data, options).toFile("report_student.pdf", function (err, data) {
                if (err) {
                    res.send(err);
                } else {
                    //res.send("File created successfully");
                    res.redirect(`/admin/${user}/student_complaints`)
                }
            });
        }
    });
     // res.send("done")
    })
})

app.get("/admin/:user/faculty_complaints",(req,res)=>{
    const user = req.params.user
let sql= `SELECT * FROM faculty NATURAL JOIN complaint_faculty`
db.query(sql,(err,answer1) => {
        if(err) throw err
       
        res.render("admin_faculty_complaints",{answer1,user})
      
    })
})

app.get("/admin/:user/pdf/faculty_complaints",(req,res)=>{
    const user = req.params.user
    let sql= `SELECT * FROM faculty NATURAL JOIN complaint_faculty`

    db.query(sql,(err,answer1) => {
        if(err) throw err
       
       let dataload = [];
       for(let i=0;i<answer1.length;i++)
       {
           dataload.push(answer1[i]);
       }

       console.log(dataload);

       ejs.renderFile( path.join(__dirname, './views/', "report-template-faculty.ejs"), {dataload: dataload}, (err, data) => {
        if (err) {
              res.send(err);
        } else {
            let options = {
                "height": "11.25in",
                "width": "8.5in",
                "header": {
                    "height": "20mm"
                },
                "footer": {
                    "height": "20mm",
                },
            };
            pdf.create(data, options).toFile("report_faculty.pdf", function (err, data) {
                if (err) {
                    res.send(err);
                } else {
                    res.redirect(`/admin/${user}/faculty_complaints`)
                    //res.send("File created successfully");
                }
            });
        }
    });
      //res.send("done")
    })
})


app.post("/admin",(req,res)=>{
   
    let username = req.body.username
    let password = req.body.password
    
    let sql = `SELECT * FROM admin WHERE Username="${username}" AND Password="${password}"`
    db.query(sql,(err,result) => {
        if(err)  throw err
        
        else
        {
           // console.log(result)
            if(result.length>0)
            {
                res.redirect(`/admin/${username}`)
           // res.send("you are admin")
            }

            else
            {
                res.render("error_admin_login")
            //  res.send("Invalid credentials")
            }
            
        }
    })
   
})

// app.get("/adminentry",(req,res)=>{
//     let sql = 'INSERT INTO admin VALUES ("sriram" , "topper")'
// db.query(sql,(err,result) => {
//         if(err) throw err
//         console.log(result)
//         res.send('admin entry created...')
//     })
// })

// app.get("/showadmin",(req,res)=>{
//     let sql = 'SELECT * FROM admin'
//     db.query(sql,(err,result)=>{
//         if(err) throw err
//         // for(r of result)
//         // {
//         //     console.log(r.Username)
//         // }
//         console.log(result)
//         res.send('admin shown')
//     })
// })

app.post("/student/add",(req,res)=>{

//console.log(req.body)
let sql = `INSERT INTO students (Fname,Lname,Gender,Category,Department,Enrollment_No,Email_Id,Mobile_no,password) VALUES ("${req.body.fname}","${req.body.lname}","${req.body.gen}","${req.body.cat}","${req.body.dept}","${req.body.id}","${req.body.email}","${req.body.num}","${req.body.password}")`

db.query(sql,(err,result) => {
    if(err) throw err
  //  console.log(result)
   //res.send('Entry created...')

   res.render("sucess_student_signup")
})
//res.redirect("/")
})

app.post("/faculty/add",(req,res)=>{
console.log(req.body)
let sql = `INSERT INTO faculty (Fname,Lname,Gender,Category,Department,Emp_ID,Designation,Email_Id,Mobile_no,password) VALUES ("${req.body.fname}","${req.body.lname}","${req.body.gen}","${req.body.cat}","${req.body.dept}","${req.body.id}","${req.body.des}","${req.body.email}","${req.body.no}","${req.body.password}")`

db.query(sql,(err,result) => {
    if(err) throw err
    //console.log(result)
    //res.send('Entry created...')
    res.render("sucess_faculty_signup")
})
//res.redirect("/")
})


app.get("/status/student/:user/:id",(req,res)=>{
    const id = req.params.id
    const user = req.params.user
    let sql = `SELECT * FROM complaint_students WHERE id="${id}"`
    db.query(sql,(err,result1) => {
                if(err) throw err
                console.log(result1[0].status)
                const result = result1[0] 
                res.render("status_update_student",{result,user})
            })
   
})

app.get("/status/faculty/:user/:id",(req,res)=>{
    const id = req.params.id
    const user = req.params.user
    let sql = `SELECT * FROM complaint_faculty WHERE id="${id}"`
    db.query(sql,(err,result1) => {
        if(err) throw err
        console.log(result1[0].status)
                const result = result1[0] 
        res.render("status_update_faculty",{result,user})
    })
    
})

app.put("/status/student/:user/:id",(req,res)=>{
    const id = req.params.id
    const user = req.params.user
    const status = req.body.status
    
    let sql = `UPDATE complaint_students SET status= "${status}" WHERE id = "${id}"`
    db.query(sql,(err,result1) => {
        if(err) throw err
        
        
    })

    res.redirect(`/admin/${user}/student_complaints`)
})

app.put("/status/faculty/:user/:id",(req,res)=>{
    const id = req.params.id
    const user = req.params.user
    const status = req.body.status
    
    let sql = `UPDATE complaint_faculty SET status= "${status}" WHERE id = "${id}"`
    db.query(sql,(err,result1) => {
        if(err) throw err
        
        
    })

    res.redirect(`/admin/${user}/faculty_complaints`)
})

app.listen(3000, ()=>{
    console.log("Server started on port 3000");
})





    
