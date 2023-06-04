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
const setPage = (pageName) => {
  pageState = {
    home: false,
    login: false
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
          <img src="./sources/assets/sign_up.svg">
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
    setTimeout(() => {
      page.home()
      root.innerHTML += '<div class="slideUpClose"></div>'
    }, 2000);
  },
  home: ()=>{
    setPage('home')
    checkUser(credUser.data.uid)
    root.innerHTML = `
      Home
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
  fetch(`${firebaseDb.API}/users/check/${id}/${credUser.data.email}`)
  .then(rawRes => { return rawRes.json() })
  .then(res => { credUser.isOldUser = res.success })
  .catch(() => {
    Notipin.Alert({
      msg: "Server UnReachable", // Pesan kamu
      yes: "Ok", // Tulisan di tombol 'Yes'
      onYes: () => { window.location.reload() },
      type: "DANGER",
      mode: "DARK",
    })
  })
}
