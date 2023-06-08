import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js'
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js'

// Initialize root document
const root = document.getElementById('root')

// initialize Global Variable
const auth = getAuth()
let firebaseDb = {}
let credUser = {
  isLogin: false,
  isReady: false,
  isOldUser: false,
  data: {},
  google: {},
  eData: {}
}

// Page Element
let pageState = {}
let pageStateCurrent = {
  homeAnimate: false
}
const setPage = (pageName) => {
  pageState = {
    home: false,
    login: false,
  }
  pageState[pageName] = true
}
const page = {
  login: ()=>{
    setPage('login')
    root.innerHTML = `
      <div class="loginFormContainer">
        <div class="loginForm">
          <h4>Login dengan sekali klik</h4>
          <img src="./sources/assets/sign_up.svg" alt="loginImage">
          <button id="googleLogin" type="button" class="GoogleBtn-Login"><img src="./sources/assets/Google.webp"><span>Google</span></button>
        </div>
      </div>
    `
    document.getElementById('googleLogin').addEventListener('click', ()=>{
      loginGoogle()
    })
  },
  loginAnimate: ()=>{
    root.innerHTML += '<div class="slideUp"></div>'
    pageStateCurrent.homeAnimate = true
    setTimeout(() => {
      page.home()
    }, 2000);
  },
  newUserWelcome: ()=>{
    root.innerHTML = `
      <div id="newUserWelcomeTransition"></div>
      <div class="newUser">
        <div class="space"></div>
        <h2>Selamat Datang Di <span class="logoText">Chat <span>ID</span></span></h2>
        <img src="./sources/assets/welcomeHappy.svg" alt="Welcome Image">
        <p>Mari nikmati sejumlah fitur dan animasi yang fresh yang dibuat oleh Devloper untuk Pengguna</p>
        <p>Trimakasih telah menggunakkan aplikasi kami sebagai sarana Komunikasi</p>
        <button id="startBtn" class="btn btn-primary">Mari Mulai</button>
        <div class="space"></div>
      </div>
    `
    setTimeout(() => {
      document.getElementById('newUserWelcomeTransition').style.display = 'none'
    }, 3250);
    document.getElementById('startBtn').addEventListener('click', ()=>{
      page.loginAnimate()
    })
  },
  home: async ()=>{
    let isLastLogin = false;
    if (pageState.login) {
      isLastLogin = true
    };
    setPage('home')
    if (!(await checkUser(credUser.data.uid))) return page.newUserWelcome()
    if (pageStateCurrent.homeAnimate) {
      root.innerHTML = '<div id="slideUpClose"></div>'
      pageStateCurrent.homeAnimate = false
      setTimeout(() => {
        document.getElementById('slideUpClose').style.display = 'none'
      }, 3250);
    } else {
      root.innerHTML = ''
    }
    root.innerHTML += `
      <div id="homePage" ${(!isLastLogin || !pageStateCurrent.homeAnimate) ? 'class="fadeAnimation"':''}>
        <nav class="homeNavbar">
          <img src="${firebaseDb.API}/user/profile/${credUser.data.uid}">
          <h6>${credUser.eData.DisplayName}</h6>
          <span class="flexSparator"></span>
          <button class="elipsBtn" id="elipsBtn"><i class="fa-solid fa-lg fa-ellipsis-vertical"></i></button>
        </nav>
        <div class="itemElips itemElipsClose" id="itemElips">
          <div class="arrowUp"></div>
          <div id="elipsSelection">
            <button class="btn btn-danger" onClick="logOut()">LogOut</button>
          </div>
        </div>
        <div id="chatListRoom"></div>
      </div>
    `
    let elipsSwitch = false
    document.getElementById('elipsBtn').addEventListener('click', ()=>{
      if (elipsSwitch) {
        elipsSwitch = false
        document.getElementById('elipsBtn').innerHTML = '<i class="fa-solid fa-lg fa-ellipsis-vertical"></i>'
        document.getElementById('itemElips').classList.remove('itemElipsOpen')
        document.getElementById('itemElips').classList.add('itemElipsClose')
      } else {
        elipsSwitch = true
        document.getElementById('elipsBtn').innerHTML = '<i class="fa-solid fa-lg fa-xmark"></i>'
        document.getElementById('itemElips').classList.add('itemElipsOpen')
        document.getElementById('itemElips').classList.remove('itemElipsClose')
      }
    })
    const checkLoadedChatMsg = (data) => {
      return new Promise((resolve)=>{
        let loadedChatMsg = JSON.parse(data);
        const allChatId = Object.keys(loadedChatMsg);
        for (const chatId of credUser.eData.UserState.GroupList) {
          if (!(allChatId.includes(chatId))) {
            loadedChatMsg[chatId] = {
              Name: 'none',
              LastChat: {},
              UnRead: []
            };
          };
        }
        for (const chatId of credUser.eData.UserState.PrivateChat) {
          if (!(allChatId.includes(chatId))) {
            loadedChatMsg[chatId] = {
              Name: 'none',
              LastChat: {},
              UnRead: []
            };
          };
        }
        resolve(loadedChatMsg)
      })
    }
    const convertLoadedToPost = (data)=>{
      return new Promise((resolve)=>{
        const allChatId = Object.keys(data);
        let Result = {}
        for (const chatId of allChatId) {
          if ((data[chatId].UnRead).length > 0) {
            Result[chatId] = (data[chatId].UnRead).map((msg) => {
              return msg.Id
            })
          } else {
            Result[chatId] = []
          }
        }
        resolve(Result)
      })
    }
    let currentChatList = ''
    const renderChatList = async (data) => {
      if (currentChatList !== JSON.stringify(data)) {
        currentChatList = JSON.stringify(data);
        const chatListRoom = document.getElementById('chatListRoom');
        const allChatId = Object.keys(data);
        let chatListRoomValue = ''
        for (const chatId of allChatId) {
          const selected = data[chatId]
          chatListRoomValue += `
            <div class="thisChat" id="global">
              <img src="${(chatId.includes('-')) ? `${firebaseDb.API}/user/profile/${(chatId.split('-')).filter(id => id !== credUser.data.uid)}` : `${firebaseDb.API}/group/profile/${chatId}`}" alt="blank Group">
              <div class="chatInfo">
                <h8>${selected.Name}</h8>
                <p ${(!selected.LastChat) ? 'style="opacity: 0;"' : ''}>${(await getUsername(selected.LastChat?.From))?.DisplayName}: ${(selected.LastChat?.Type === 'text') ? selected.LastChat?.Body : selected.LastChat?.Type}</p>
              </div>
              <div class="chatInfo2">
                <p ${(selected.UnRead.length === 0) ? 'style="opacity: 0;"' : ''}>${selected.UnRead.length}</p>
                <p ${(!selected.LastChat) ? 'style="opacity: 0;"' : ''}>${selected.LastChat?.Time}</p>
              </div>
            </div>
          `
        }
        chatListRoom.innerHTML = chatListRoomValue
      }
      setTimeout(() => {
        loadChatList()
      }, 2512);
    }
    const loadChatList = async ()=>{
      let loadedChatMsg = localStorage.getItem('loadedChatMsg')
      if (`${loadedChatMsg}`.length > 10) {
        loadedChatMsg = await checkLoadedChatMsg(loadedChatMsg)
      } else {
        loadedChatMsg = await checkLoadedChatMsg('{}')
      }
      fetch(`${firebaseDb.API}/chats/MessageNMinimal/fromUser/${credUser.data.uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loadedChatMsg: await convertLoadedToPost(loadedChatMsg)
        })
      })
      .then((rawRes) => { return rawRes.json() })
      .then(async (res) => {
        const { data } = res;
        const allChatId = Object.keys(data);
        for (const chatId of allChatId) {
          const selected = data[chatId];
          loadedChatMsg[chatId].Name = selected.Name;
          loadedChatMsg[chatId].LastChat = selected.LastChat;
          for (const msg of selected.FilteredMsg) {
            loadedChatMsg[chatId].UnRead.push(msg)
          }
        }
        localStorage.setItem('loadedChatMsg', JSON.stringify(loadedChatMsg))
        renderChatList(loadedChatMsg)
      })
      .catch(()=>{
        setTimeout(() => {
          loadChatList()
        }, 5000);
      })
    }
    loadChatList()
  }
}

// Auth Function
const google = new GoogleAuthProvider();
const loginGoogle = ()=>{
  signInWithPopup(auth, google)
  .then((result) => {
    credUser.google = GoogleAuthProvider.credentialFromResult(result);
    credUser.google.user = result.user;
  })
  .catch((error) => {
    Notipin.Alert({
      msg: error.message, // Pesan kamu
      yes: "Ok", // Tulisan di tombol 'Yes'
      onYes: () => { /* Kode di sini */ },
      type: "DANGER",
      mode: "DARK",
    })
    credUser.google = GoogleAuthProvider.credentialFromError(error);
  })
}

const logOut = ()=>{
  Notipin.Confirm({
    msg: "Do you want to LogOut?", // Pesan kamu
    yes: "Yes", // Tulisan di tombol 'Yes'
    no: "No", // Tulisan di tombol 'No'
    onYes: () => {
      signOut(auth)
      .then(()=>{
        Notipin.Alert({
          msg: "Succes LogOut", // Pesan kamu
          yes: "Ok", // Tulisan di tombol 'Yes'
          onYes: () => { /* Kode di sini */ },
          type: "NORMAL",
          mode: "DARK",
        })
      })
      .catch(()=>{
        Notipin.Alert({
          msg: "Failed To Logout", // Pesan kamu
          yes: "Ok", // Tulisan di tombol 'Yes'
          onYes: () => { /* Kode di sini */ },
          type: "DANGER",
          mode: "DARK",
        })
      })
    },
    onNo: () => { /* Kode di sini */ },
    type: "BLUE",
    mode: "DARK",
  })
}
window.logOut = logOut


// check firebase database
const fRdb = getDatabase();
const starCoutRef = ref(fRdb, '/');
onValue(starCoutRef, (snapshot)=>{
  firebaseDb = snapshot.val()
  credUser.isReady = true
})

// Auth Check
onAuthStateChanged(auth, (user)=>{
  if (user) {
    credUser.isLogin = true;
    credUser.data = user
  } else {
    credUser.data = {}
    credUser.isLogin = false;
  }
})

// Check State
setInterval(() => {
  if (credUser.isReady) {
    if (firebaseDb.Status.isTrue) {
      root.innerHTML = `<center>
          ${(firebaseDb.Status.Type === 'mnt') ?
          `<div class="statusAlert"><h4>Website under Mintanance</h4><p>${firebaseDb.Status.Message}</p></div>` :
          `<div class="statusAlert"><h4>Alert</h4><p>${firebaseDb.Status.Message}</p></div>`}
        </center>`
    } else {
      if (credUser.isLogin) {
        // Go Home
        if (!pageState.home) {
          if (pageState.login) {
            page.loginAnimate()
            setPage('home')
          } else {
            page.home()
          }
        };
      } else {
        // Go Login
        if (!pageState.login) {
          page.login()
        };
      }
    }
  };
}, 500);

// Fetch
const getUsername = (id)=>{
  return new Promise((resolve)=>{
    fetch(`${firebaseDb.API}/users/getUsername/${id}`, { method: 'GET' })
    .then((rawRes) => { return rawRes.json()})
    .then((res) => {
      resolve(res.data)
    })
    .catch(()=> {
      resolve({
        DisplayName: 'Deleted User',
        UserName: 'deleted_user'
      })
    })
  })
}

// Fetch Area
const checkUser = (id) => {
  return new Promise((resolve) => {
    fetch(`${firebaseDb.API}/users/check/${id}/${credUser.data.email}`)
    .then(rawRes => { return rawRes.json() })
    .then(res => { credUser.isOldUser = res.success; credUser.eData = res.data;resolve(res.success) })
    .catch(() => {
      Notipin.Alert({
        msg: "Server UnReachable", // Pesan kamu
        yes: "Ok", // Tulisan di tombol 'Yes'
        onYes: () => { window.location.reload() },
        type: "DANGER",
        mode: "DARK",
      })
    })
  })
  
}
