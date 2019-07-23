const socket=io()
// socket.on('countUpdated',(count)=>{
//  console.log(`The count has been updated ${count}`)
// })
// document.querySelector('#add').addEventListener('click',()=>{
//     console.log('click')
//     socket.emit('updated')
// })

// Elements
const chatForm=document.querySelector('#message-form')
const chatFormInput=chatForm.querySelector('input')
const chatFormButton=chatForm.querySelector('button')
const locationBut=document.getElementById('location')
const messages=document.getElementById('messages')

// Templates
const messageTemplate=document.getElementById('message-template').innerHTML
const locationTemplate=document.getElementById('location-template').innerHTML
const sidebarTemplate=document.getElementById('sidebar-template').innerHTML
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll= () => {
    // New message element
    const $newMessage = messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = messages.offsetHeight

    // Height of messages container
    const containerHeight = messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('Message',(message)=>{
    console.log(message)
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})
socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.getElementById('sidebar').innerHTML=html
})
socket.on('locationMessage',(url)=>{
    console.log(url)
    const html=Mustache.render(locationTemplate,{
        username:url.username,
        url:url.url,
        createdAt:moment(url.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

chatForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    chatFormButton.setAttribute('disabled','disabled')
   const message=e.target.elements.message.value
   socket.emit('sendmess',message,(error)=>{
       chatFormButton.removeAttribute('disabled')
       chatFormInput.value=''
       chatFormInput.focus()
       if(error){
           return console.log(error)
       }
       console.log('message was delivered')
   })
})
document.getElementById('location').addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Your browers doesnt supoort location sharing')
    }
    locationBut.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((pos)=>{
        // console.log(pos.coords.latitude)
        // console.log(pos.coords.longitude)
        const position={
            latitude:pos.coords.latitude,
            longitude:pos.coords.longitude
        }
        socket.emit('sendLocation',position,(error)=>{
            if(error){
                return console.log(error)
            }
            locationBut.removeAttribute('disabled')
            console.log('location delivered succesfull')
        })
    })
})
socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})