import React,{ useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";

const socket = io.connect('http://localhost:5000')

function Chat() {
  const [ stream, setStream ] = useState()
  const [ receivingCall, setReceivingCall ] = useState(false)
  const [ caller, setCaller ] = useState("")
  const [ callerSignal, setCallerSignal ] = useState()
  const [ callAccepted, setCallAccepted ] = useState(false)
  const [ idToCall, setIdToCall ] = useState("")
  const [ callEnded, setCallEnded] = useState(false)
  const [ name, setName ] = useState("")
  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef= useRef()

  useEffect(() => {

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
      setStream(stream)
        myVideo.current.srcObject = stream
    })

    socket.emit('join', 'fey')

    socket.on("callUser", (data) => {
      setReceivingCall(true)
      setCaller(data.from)
      setName(data.name)
      setCallerSignal(data.signal)
    })
  }, [])

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    })

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: 'fey-clone',
        signalData: data,
        from: 'fey',
        name: 'fey'
      })
    })

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream
    })
    
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true)
      peer.signal(signal)
    })

    connectionRef.current = peer
  }

  const answerCall =() =>  {
    setCallAccepted(true)
    
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    })

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller })
    })

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream
    })

    peer.signal(callerSignal)
    connectionRef.current = peer
  }

  const leaveCall = () => {
    setCallEnded(true)
    connectionRef.current.destroy()
  }

  return (
    <>
      <h1>zoomish</h1>
      <div className="container">
        <div className="video-container">
          <div className="video">
            {stream && <video playsInline muted ref={myVideo} autoPlay style={{width: "300px" }} />}
          </div>
          <div className="video">
            {callAccepted && !callEnded ? 
              <video playsInline ref={userVideo} autoPlay style={{width:"300px"}}/>
            : null}
          </div>
        </div>
        <div className="myId">
          <div className="call-button">
            {callAccepted && !callEnded ? (
              <button onClick={leaveCall}>End Call</button>
            ):(
              <button onClick={()=>callUser(idToCall)}>call me</button>
            )}
          </div>
        </div>
        <div>
        {receivingCall && !callAccepted ? (
          <div className="caller">
            <h1>{name} is calling ...</h1>
            <button onClick={answerCall}>Answer</button>
          </div>
        ):null}
        </div>
      </div>
    </>
  );
}

export default Chat;
