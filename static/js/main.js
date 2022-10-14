console.log("working!");
const client = io("/");

// global peer connection
const pc = new RTCPeerConnection();
let clientId;
let receiverId;

// local and remote video containers
const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");

client.on("connect", () => {
  clientId = client.id;

  const personalCode = document.getElementById("personal-code");
  personalCode.innerHTML = clientId;
  console.log("connected to server!");

  /* WebRTC */
  client.on("offer", async (data) => {
    // when someone sends an offer
    if (data.offer) {
      const remoteDescription = new RTCSessionDescription(data.offer); // set their offer as remote description
      pc.setRemoteDescription(remoteDescription);

      const answer = await pc.createAnswer(); // create an answer and set local description as the answer
      await pc.setLocalDescription(answer);

      client.emit("answer", {
        // send answer to caller
        sender: clientId,
        receiver: data.sender,
        answer,
      });
    }
  });

  client.on("answer", async (data) => {
    // when someone callee sends an answer
    if (data.answer) {
      const remoteDescription = new RTCSessionDescription(data.answer); // set their answer as remote description
      await pc.setRemoteDescription(remoteDescription);
    }
  });

  client.on("add-ice-candidate", async (data) => {
    // listen for ice candidates from remote
    if (data.iceCandidate) {
      await pc.addIceCandidate(data.iceCandidate);
    }
  });
});

pc.onicecandidate = (event) => {
  // send local ice candidates to remote
  if (event.candidate) {
    client.emit("add-ice-candidate", {
      iceCandidate: event.candidate,
      receiver: receiverId,
    });
  }
};

// listen for remote stream
pc.ontrack = (event) => {
  const [remoteStream] = event.streams;
  remoteVideo.srcObject = remoteStream;
};

/* local video */

const setLocalVideo = async () => { // reuse this for voice call; just set video to false
  const localMedia = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  localMedia.getTracks().forEach((track) => {
    pc.addTrack(track, localMedia);
  });
  localVideo.srcObject = localMedia;

  // hide cam functionality
  const hideCam = document.getElementById("hide-cam");
  hideCam.addEventListener("click", () => {
    const enabled = localMedia.getVideoTracks()[0].enabled;
    localMedia.getVideoTracks()[0].enabled = !enabled;
  });

  // mute functionality
  const mute = document.getElementById("mute");
  mute.addEventListener("click", () => {
    const enabled = localMedia.getAudioTracks()[0].enabled;
    localMedia.getAudioTracks()[0].enabled = !enabled;
  });

  return localMedia;
};

// set local stream
const localMedia = setLocalVideo();

// functions
const makeOffer = async () => {
  receiverId = document.getElementById("code-input").value;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  client.emit("offer", {
    sender: clientId,
    receiver: receiverId,
    offer: offer,
  });
};

// binding
const sendButton = document.getElementById("send-offer");
sendButton.addEventListener("click", makeOffer);
