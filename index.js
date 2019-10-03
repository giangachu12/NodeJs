const express = require("express");
const app = express();
const sql = require("mssql");
const multer = require("multer");
const fs = require("fs");
const session = require('express-session');
const parseurl = require('parseurl');

// =========>>> wait
const config = {
    user: "sa",
    password: "giangchu12042000",
    server: "localhost",
    database: "myshop",
    port: 1433,
    option: {
        trustedConnection: true,
        encrypt: false
    }
};
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/upload');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})
var upload = multer({ storage: storage }).single('file');
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./view");

//upp load file
app.use(session({
    secret: 'doraemon',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 20000
    }
}))
app.use(function (req, res, next) {
    if (!req.session.views) {
        req.session.views = {}
    }
    console.log(req.session.views, '===============>gdf')
    // get the url pathname
    const pathname = parseurl(req).pathname
    console.log(pathname, '=========> path name')

    req.session.views[pathname] = (req.session.views[pathname] || 0) + 1
    console.log(req.session.views[pathname], '===========>path sesion')
    next()
})
let sess;
// ----------trang hiển thị đặt mua
app.post('/home/dangnhap', function (req, res) {
    sess = req.session;
    var ms = req.body.ms;
    console.log(ms, '===============================================>ms')
    sess.email = req.body.email;
    console.log(sess.email, '========>sess.email')
    res.send(ms)
})
app.get("/home/info/:masp", function (req, res) {
    sess = req.session;
    var id = req.params.masp;
    console.log(id, "==============id")
    sql.connect(config, function (err) {
        if (err) return res.send(err);
        var reques = new sql.Request();
        reques.query("select * from sampham where masp = " + id, function (err, recordset) {
            sql.close();
            if (err) {
                return res.send(err)
            } else {
                if (sess.email) {
                    console.log(recordset, '=======>okek')
                    res.render("infor", { data: recordset })
                } else {
                    console.log(recordset, '=======>oke==')
                    res.render('login', { data: recordset });
                }
            }
        })
    })
})

app.get("/home/add", function (req, res) {
    res.render("upfile");
})
app.post("/home/add", function (req, res) {
    // console.log(req.body)
    upload(req, res, function (err) {
        if (err) {
            return res.send(err + "===========>loi post");
        } else {
            if (!req.file) {
                res.send("you need choose file img");
            } else {
                sql.connect(config, function (err) {
                    if (err) return res.send(err + "======>loi connec addfile");
                    console.log(req.file.originalname, '===============>file image')
                    var insert = "insert into sampham values ('" + req.body.masp + "','" + req.body.tensp + "','" + req.file.originalname + "','" + req.body.soluong + "','" + req.body.donvi + "','" + req.body.gia + "')";
                    console.log(insert, "===========>insert")
                    var reques = new sql.Request();
                    reques.query(insert, function (err, recordset) {
                        sql.close();
                        if (err) {
                            return res.send(err + "============>rrr reques 11");
                        }
                        console.log(recordset + "===========>record upload")
                        res.redirect("/")
                    })
                })
            }
        }
    })
})

// ------------chinh sua file
app.get("/home/edit/:masp/:anh", function (req, res) {
    var id = req.params.masp;
    id = parseInt(id);
    sql.connect(config, function (err) {
        if (err) return res.send(err + "======>loi connec addfile")
        var reques = new sql.Request();
        reques.query("select * from sampham where masp =" + id, function (err, recordset) {
            sql.close();
            if (err) {
                return res.send(err + "============>rrr reques 11");
            }
            res.render("edit", { data: recordset })
        })
    })
})

app.post("/home/edit/:masp/:anh", function (req, res) {
    var id = req.params.masp;
    id = parseInt(id);
    console.log("=============>elseid", id)
    var imagesOlde = req.params.anh;
    console.log(imagesOlde, "=============> anh cu")
    upload(req, res, function (err) {
        console.log("--------------->else", req.body, "----------->")
        if (err) {
            res.send({ err });
        } else {
            if (!req.file) {
                sql.connect(config, function (err, recordset) {
                    if (err) {
                        res.send(err + "--------->loix")
                    }
                    var reques = new sql.Request();
                    reques.query("update sampham set tensp = '" + req.body.tensp + "',soluong ='" + req.body.soluongg + "',gia='" + req.body.gia + "'where masp =" + id, function (err, recordset) {
                        sql.close();
                        if (err) {
                            return res.send(err);
                        }
                        res.redirect("/");
                    })
                })
            } else {
                sql.connect(config, function (err) {
                    var reques = new sql.Request();
                    reques.query("update sampham set tensp = '" + req.body.tensp + "',soluong ='" + req.body.soluongg + "',gia='" + req.body.gia + "',anh ='" + req.file.originalname + "'where masp =" + id, function (err, recordset) {
                        sql.close();
                        //---->xoa anh khi chinh sua
                        if (err) {
                            return res.send(err)
                        }
                        fs.unlinkSync("./public/upload/" + imagesOlde);
                        res.redirect("/");
                    })
                })
            }
        }
    })
})
//----delet
app.get("/home/delet/:masp/:anh", function (req, res) {
    var id = req.params.masp;
    id = parseInt(id);
    console.log(id, "================>id delete")
    var anh = req.params.anh;
    //---xoa anh;
    console.log(anh)
    var ui = "./public/upload/" + anh;
    console.log(ui, "-------------------------->> ui anh ")

    sql.connect(config, function (err) {
        if (err) return res.send(err + "======>loi connec addfile")
        var reques = new sql.Request();
        reques.query("delete from sampham where masp =" + id, function (err, recordset) {
            sql.close();
            if (err) {
                return res.send(err + "============>rrr delete 11");
            }

            fs.unlinkSync(ui);
            res.redirect("/")
        })
    })
})
//------home
app.get("/home/list", function (req, res) {
    sql.connect(config, function (err) {
        if (err) return res.send(err);
        var reques = new sql.Request();
        reques.query("select * from sampham ", function (err, data) {
            sql.close();
            if (err) return res.send(err);
            console.log(data)
            res.send({ data: data.recordset })
        })
    })
})
app.listen(2004);