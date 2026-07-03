import express from "express"
import cors from "cors"
import path from "path";

const app = express();

//Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN?split(",") : "https://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
    }
));
app.use(express.json({ limit: "16kb"}))
app.use(express.urlencoded({ extended: "true", limit: "16kb" }));
app.use(express.static("./public"))


//import routes
import healthCheckRouter from "./routes/healthcheck.route.js";

app.use("/api/v1/healthcheck", healthCheckRouter);

app.get('/', (req,res)=>{
    res.send(index.html);
});

app.get('/about', (req, res)=>{
    res.send("<h1>This is about page</h1>");
});


export default app;