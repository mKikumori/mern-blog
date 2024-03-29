const express = require('express')
const cors = require('cors')
const {connect} = require('mongoose')
require('dotenv').config()
const upload = require('express-fileupload')

const userRoutes = require('./routes/userRoutes.js')
const postRoutes = require('./routes/postRoutes.js')
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js')

const app = express()
app.use(express.json({extended: true}))
app.use(express.urlencoded({extended: true}))
app.use(cors({credentials: true, origin: ["https://mern-blog-client-vrn5.onrender.com"], methods: ["POST", "GET", "PATCH", "DELETE"]}))
app.use(upload())

app.get('/', (req, res) => {
    res.json("Hello")
})


app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)


app.use(notFound)
app.use(errorHandler)


connect('mongodb+srv://kiku:WB9DiKBcoJa84LpT@cluster0.7zycfvs.mongodb.net/mern-blog').then(app.listen(5000, () => console.log(`Server running on port ${5000}`))).catch(error => {console.log(error)})

