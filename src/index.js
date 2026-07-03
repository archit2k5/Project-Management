import dotenv from 'dotenv'
import app from "./app.js"
import connectDB from './db/db.js';

dotenv.config({
    path: `./.env`,
})

const port= process.env.PORT;

connectDB()
    .then(()=>{
        app.listen(port, ()=>{
        console.log(`The server is listening to port: ${port}`);
        });
    })
    .catch((error)=>{
        console.error("Error connection with DB", error);
    })


