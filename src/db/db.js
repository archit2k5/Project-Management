import mongoose from "mongoose";

const connectDB= async ()=>{
    try{
        await mongoose.connect(process.env.DB_URI);
        console.log("DB connected succesfully");
    }catch(error){
        console.log("Error connecting to DB");
        process.exit(1);
    }
};

export default connectDB;