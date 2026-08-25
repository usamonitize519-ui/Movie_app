import express from "express";
import multer from "multer";
import http from "http";
import path from "path";
import fs from "fs";
import {WebSocketServer} from "ws";
import {fileURLToPath} from "url";
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express(), server=http.createServer(app);
const dir=path.join(__dirname,"uploads"); fs.mkdirSync(dir,{recursive:true});
const storage=multer.diskStorage({destination:dir,filename:(r,f,cb)=>cb(null,Date.now()+"-"+f.originalname.replace(/[^a-zA-Z0-9._-]/g,"_"))});
app.use(express.static(__dirname));
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "Index.html"));
});
app.use("/uploads",express.static(dir));
app.post("/upload",multer({storage}).single("movie"),(req,res)=>req.file?res.json({url:"/uploads/"+req.file.filename,name:req.file.originalname}):res.status(400).json({error:"No movie"}));
const wss=new WebSocketServer({server,path:"/ws"}), rooms=new Map();
wss.on("connection",ws=>{
  ws.on("message",raw=>{let m;try{m=JSON.parse(raw)}catch{return}
    if(m.type==="join"){ws.room=String(m.room||"LOVE1234");if(!rooms.has(ws.room))rooms.set(ws.room,new Set);rooms.get(ws.room).add(ws);return}
    if(ws.room)for(const c of rooms.get(ws.room)||[])if(c!==ws&&c.readyState===1)c.send(JSON.stringify(m));
  });
  ws.on("close",()=>{if(ws.room&&rooms.has(ws.room)){rooms.get(ws.room).delete(ws);if(!rooms.get(ws.room).size)rooms.delete(ws.room)}});
});
server.listen(process.env.PORT||3000,()=>console.log("My Movie is running"));
