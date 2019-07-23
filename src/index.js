const path=require('path')
const http=require('http')
const express=require('express')
const socket=require('socket.io')
const app=express()
const server=http.createServer(app)
const io=socket(server)
const Filter=require('bad-words')
const {generateMessage,generateLocation }=require('./utils/message')
const { addUser,removeUser,getUser,getUserInroom }=require('./utils/users')

// Setting up directory
const viewsPath=path.join(__dirname,'../Templates')
const publicPath=path.join(__dirname,'../public')

app.set('view engine','hbs')
app.set('views',viewsPath)
app.use(express.static(publicPath))
const port=process.env.PORT || 3000

// app.get('',(req,res)=>{
// res.render('index',{
//     title:'Chat app'
// })
// })
// let count=0
// io.on('connection',(socket)=>{
//     console.log('New webSocket connection')
//     socket.emit('countUpdated',count)
//     socket.on('updated',()=>{
//         count++
//         // socket.emit('countUpdated',count)
//         io.emit('countUpdated',count)
//     })
// })
io.on('connection',(socket)=>{
    console.log('New webSocket connection')
    socket.on('join',({username,room},callback)=>{
        const { error, user }=addUser({id:socket.id,username:username,room:room})
        if(error){
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('Message',generateMessage('Admin','Welcome'))
        socket.broadcast.to(user.room).emit('Message',generateMessage('Admin',`${user.username} has joined us!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUserInroom(user.room)
        })
    })

    socket.on('sendmess',(mess,callback)=>{
      const user=getUser(socket.id)
      const filter=new Filter()
      if(filter.isProfane(mess)){
          return callback('bad words not allowed')
      }
      io.to(user.room).emit('Message',generateMessage(user.username,mess))
      callback()
    })

    socket.on('sendLocation',(position,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocation(user.username,`https://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback()
    })

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('Message',generateMessage('Admin',`${user.username} has left the chat`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUserInroom(user.room)
            })
        }
    })
 
})
server.listen(port,()=>{
 console.log(`Server started at ${port}`)
})