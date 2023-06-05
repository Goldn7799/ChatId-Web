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
  google: {}
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
    setPage('home')
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
    if ((await checkUser(credUser.data.uid))) return page.newUserWelcome()
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
        <center><h4>Home</h4></center>
      </div>
    `
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

// Fetch Area
const checkUser = (id) => {
  return new Promise((resolve) => {
    fetch(`${firebaseDb.API}/users/check/${id}/${credUser.data.email}`)
    .then(rawRes => { return rawRes.json() })
    .then(res => { credUser.isOldUser = res.success; resolve(res.success) })
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
