import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js'
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js'

// Initialize root document
const root = document.getElementById('root')

// initialize Global Variable
let firebaseDb = {}
let credUser = {
  isLogin: false,
  data: {}
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
          <button type="button" class="GoogleBtn-Login"><img src="./sources/assets/Google.webp"><span>Google</span></button>
        </div>
      </div>
    `
  },
  home: ()=>{
    setPage('home')
    root.innerHTML = `
      Home
    `
  }
}


// check firebase database
const fRdb = getDatabase();
const starCoutRef = ref(fRdb, '/');
onValue(starCoutRef, (snapshot)=>{
  firebaseDb = snapshot.val()
  // Check State
  if (firebaseDb.Status.isTrue) {
    root.innerHTML = `<center>
        ${(firebaseDb.Status.Type === 'mnt') ?
        `<div class="statusAlert"><h4>Website under Mintanance</h4><p>${firebaseDb.Status.Message}</p></div>` :
        `<div class="statusAlert"><h4>Alert</h4><p>${firebaseDb.Status.Message}</p></div>`}
      </center>`
  } else {
    if (credUser.isLogin) {
      // Go Home
      page.home()
    } else {
      // Go Login
      page.login()
    }
  }
})

// Auth Check
const auth = getAuth()
onAuthStateChanged(auth, (user)=>{
  if (user) {
    credUser.isLogin = true;
    credUser = user
  } else {
    credUser = {}
    credUser.isLogin = false;
  }
})
