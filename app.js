window.addEventListener('DOMContentLoaded', () => {
  const state = {
    transport: 'bus',
    user: null,
    searchResults: [],
    selectedOffer: null,
  };

  const storage = {
    usersKey: 'qt_users_v1',
    currentUserKey: 'qt_current_user_v1',
    bookingsKey: 'qt_bookings_v1',
    loadUsers(){ return JSON.parse(localStorage.getItem(this.usersKey) || '{}') },
    saveUser(email,data){
      const u=this.loadUsers();u[email]=data;
      localStorage.setItem(this.usersKey,JSON.stringify(u))
    },
    getCurrentUser(){ return JSON.parse(localStorage.getItem(this.currentUserKey) || 'null') },
    setCurrentUser(u){ localStorage.setItem(this.currentUserKey, JSON.stringify(u)) },
    loadBookings(){ return JSON.parse(localStorage.getItem(this.bookingsKey) || '[]') },
    saveBookings(b){ localStorage.setItem(this.bookingsKey, JSON.stringify(b)) }
  };


  // ---- DOM ----
  const tabs = document.getElementById('transportTabs')
  const resultsEl = document.getElementById('results')
  const searchBtn = document.getElementById('searchBtn')
  const clearBtn = document.getElementById('clearBtn')
  const fromInput = document.getElementById('from')
  const toInput = document.getElementById('to')
  const dateInput = document.getElementById('date')
  const passSelect = document.getElementById('passengers')
  const backBtn = document.getElementById('backBtn')

  const authModal = document.getElementById('authModal')
  const openAuth = document.getElementById('openAuth')
  const closeAuth = document.getElementById('closeAuth')
  const loginBtn = document.getElementById('loginBtn')
  const registerBtn = document.getElementById('registerBtn')
  const showRegister = document.getElementById('showRegister')
  const showLogin = document.getElementById('showLogin')
  const welcomeText = document.getElementById('welcomeText')

  const viewHistoryBtn = document.getElementById('viewHistory')
  const historyArea = document.getElementById('historyArea')
  const historyList = document.getElementById('historyList')
  const closeHistory = document.getElementById('closeHistory')

  const bookModal = document.getElementById('bookModal')
  const bookingDetails = document.getElementById('bookingDetails')
  const confirmBookBtn = document.getElementById('confirmBookBtn')
  const cancelBookBtn = document.getElementById('cancelBookBtn')
  const closeBook = document.getElementById('closeBook')

  // Auth form fields
  const loginEmail = document.getElementById('loginEmail')
  const loginPass = document.getElementById('loginPass')
  const regName = document.getElementById('regName')
  const regEmail = document.getElementById('regEmail')
  const regPass = document.getElementById('regPass')

  // ---- Event wiring ----
  // Tabs
  if(tabs){
    tabs.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', ()=>{
        tabs.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'))
        t.classList.add('active')
        state.transport = t.dataset.type
        renderIntroForTransport()
      })
    })
  }

  // Open/close auth
  if(openAuth) openAuth.addEventListener('click', ()=>{authModal.style.display='flex'})
  if(closeAuth) closeAuth.addEventListener('click', ()=>{authModal.style.display='none'})
  if(showRegister) showRegister.addEventListener('click', ()=>{document.getElementById('loginForm').style.display='none';document.getElementById('registerForm').style.display='block'})
  if(showLogin) showLogin.addEventListener('click', ()=>{document.getElementById('loginForm').style.display='block';document.getElementById('registerForm').style.display='none'})

  // login / register
  if(loginBtn) loginBtn.addEventListener('click', ()=>{
    const email = (loginEmail && loginEmail.value || '').trim().toLowerCase()
    const pass = loginPass && loginPass.value
    if(!email || !pass){alert('Please enter email and password');return}
    const users = storage.loadUsers()
    if(users[email] && users[email].pass===pass){
      state.user = {email, name: users[email].name}
      storage.setCurrentUser(state.user)
      updateAuthUI()
      authModal.style.display='none'
      if(loginEmail) loginEmail.value=''
      if(loginPass) loginPass.value=''
      alert('Logged in as '+state.user.name)
    } else alert('Invalid credentials')
  })
  if(registerBtn) registerBtn.addEventListener('click', ()=>{
    const name = regName && regName.value.trim(); const email = regEmail && regEmail.value.trim().toLowerCase(); const pass = regPass && regPass.value
    if(!name||!email||!pass){alert('Please fill all fields');return}
    const users = storage.loadUsers()
    if(users[email]){alert('Account already exists with this email');return}
    storage.saveUser(email,{name,pass})
    if(regName) regName.value=''; if(regEmail) regEmail.value=''; if(regPass) regPass.value=''
    alert('Account created — you can now login')
    document.getElementById('loginForm').style.display='block';document.getElementById('registerForm').style.display='none'
  })

  // History
  if(viewHistoryBtn) viewHistoryBtn.addEventListener('click', ()=>{renderHistory();historyArea.style.display='block';document.getElementById('searchArea').style.display='none'})
  if(closeHistory) closeHistory.addEventListener('click', ()=>{historyArea.style.display='none';document.getElementById('searchArea').style.display='block'})

  // Search / Clear
  if(searchBtn) searchBtn.addEventListener('click', doSearch)
  if(clearBtn) clearBtn.addEventListener('click', ()=>{if(fromInput) fromInput.value=''; if(toInput) toInput.value=''; if(dateInput) dateInput.value=''; if(passSelect) passSelect.value='1'; if(resultsEl) resultsEl.innerHTML='';})

  if(backBtn) backBtn.addEventListener('click', ()=>{window.history.back(); /* also keep a simple UI action */ })

  // Booking modal controls
  if(cancelBookBtn) cancelBookBtn.addEventListener('click', ()=>{bookModal.style.display='none'})
  if(closeBook) closeBook.addEventListener('click', ()=>{bookModal.style.display='none'})
  if(confirmBookBtn) confirmBookBtn.addEventListener('click', confirmBooking)

  // init
  (function init(){
    state.user = storage.getCurrentUser()
    updateAuthUI()
    renderIntroForTransport()
  })();

  function updateAuthUI(){
    if(state.user){
      if(welcomeText) welcomeText.textContent = 'Hello, '+(state.user.name||state.user.email)
      if(openAuth){
        openAuth.textContent = 'Sign out'
        openAuth.onclick = ()=>{if(confirm('Sign out?')){storage.setCurrentUser(null);state.user=null;updateAuthUI()}}
      }
    } else {
      if(welcomeText) welcomeText.textContent = 'Not signed in'
      if(openAuth){
        openAuth.textContent = 'Login / Register'
        openAuth.onclick = ()=>{authModal.style.display='flex'}
      }
    }
  }

  function renderIntroForTransport(){
    // Small hint area depending on transport
    const tab = state.transport
    // subtle placeholder suggestions
    if(tab==='bus'){
      if(fromInput) fromInput.placeholder='City or Bus Station (e.g., Delhi)'
      if(toInput) toInput.placeholder='City or Bus Station (e.g., Jaipur)'
    } else if(tab==='train'){
      if(fromInput) fromInput.placeholder='Station code or name (e.g., NDLS)'
      if(toInput) toInput.placeholder='Station code or name (e.g., BCT)'
    } else {
      if(fromInput) fromInput.placeholder='Departure city / airport (e.g., DEL)'
      if(toInput) toInput.placeholder='Arrival city / airport (e.g., MAA)'
    }
  }

  // Mock search function returning generated offers
  function doSearch(){
    const from = fromInput && fromInput.value.trim(); const to = toInput && toInput.value.trim(); const date = dateInput && dateInput.value
    const pax = Number(passSelect && passSelect.value || 1)
    if(!from || !to || !date){alert('Please fill From, To and Departure date');return}

    // generate 4-6 offers with random-ish times/prices
    const basePrices = {bus:400, train:700, flight:3500}
    const offers = []
    const now = new Date(date+'T08:00')
    for(let i=0;i<5;i++){
      const depart = new Date(now.getTime() + (i*60+Math.floor(Math.random()*120))*60000)
      const durationMin = (state.transport==='flight')? (60+Math.floor(Math.random()*120)) : (state.transport==='train')? (120+Math.floor(Math.random()*240)) : (180+Math.floor(Math.random()*180))
      const arrive = new Date(depart.getTime() + durationMin*60000)
      const price = Math.max(100, Math.round((basePrices[state.transport] + Math.random()*basePrices[state.transport])* (1 + pax*0.12)))
      offers.push({id:Date.now() + '-' + i, from, to, depart: depart.toISOString(), arrive: arrive.toISOString(), price, pax, carrier: carrierName(i)})
    }
    state.searchResults = offers
    renderResults()
  }

  function carrierName(i){
    const bus = ['GreenLine','ExpressGo','CityWay','RoadRunner']
    const train = ['Rajdhani','Shatabdi','Express','InterCity']
    const flight = ['AirSwift','JetBlueX','SkyLine','FlyFast']
    if(state.transport==='bus') return bus[i % bus.length]
    if(state.transport==='train') return train[i % train.length]
    return flight[i % flight.length]
  }

  function renderResults(){
    if(!resultsEl) return
    resultsEl.innerHTML=''
    if(!state.searchResults.length){resultsEl.innerHTML='<div class="muted">No results found — try different dates or cities.</div>';return}
    state.searchResults.forEach(o=>{
      const div=document.createElement('div');div.className='item fade-in'
      const left=document.createElement('div');left.className='meta'
      const title=document.createElement('div');title.innerHTML=`<strong>${o.carrier}</strong> — <span class="muted">${state.transport.toUpperCase()}</span>`
      const route=document.createElement('div');route.className='muted';route.textContent=`${o.from} → ${o.to} • ${formatTime(o.depart)} — ${formatTime(o.arrive)}`
      left.appendChild(title);left.appendChild(route)

      const right=document.createElement('div');right.style.textAlign='right'
      const price=document.createElement('div');price.className='price';price.textContent='₹'+o.price
      const btn=document.createElement('button');btn.className='btn';btn.textContent='Book';btn.style.marginTop='8px'
      btn.addEventListener('click', ()=>{openBooking(o)})
      right.appendChild(price);right.appendChild(btn)

      div.appendChild(left);div.appendChild(right)
      resultsEl.appendChild(div)
    })
  }

  function formatTime(iso){
    const d=new Date(iso)
    return d.toLocaleString()
  }

  function openBooking(offer){
    if(!storage.getCurrentUser()){if(!confirm('You must be signed in to book. Open login?')) return; authModal.style.display='flex'; return}
    state.selectedOffer = offer
    if(bookingDetails) bookingDetails.innerHTML = `
      <div><strong>${offer.carrier}</strong> — ${state.transport.toUpperCase()}</div>
      <div class="small muted">${offer.from} → ${offer.to}</div>
      <div style="margin-top:8px">Departure: ${formatTime(offer.depart)}</div>
      <div>Arrival: ${formatTime(offer.arrive)}</div>
      <div style="margin-top:8px;font-weight:700">Total: ₹${offer.price}</div>
    `
    if(bookModal) bookModal.style.display='flex'
  }

  function confirmBooking(){
    const u = storage.getCurrentUser();
    if(!u){alert('Please login first'); if(bookModal) bookModal.style.display='none';return}
    const bookings = storage.loadBookings()
    const b = {
      id: 'BKG-' + Date.now(),
      user: u.email,
      name: u.name,
      transport: state.transport,
      offer: state.selectedOffer,
      createdAt: new Date().toISOString()
    }
    bookings.push(b)
    storage.saveBookings(bookings)
    if(bookModal) bookModal.style.display='none'
    alert('Booking confirmed — ID: ' + b.id)
  }

  function renderHistory(){
    const all = storage.loadBookings()
    const u = storage.getCurrentUser()
    if(historyList) historyList.innerHTML=''
    const list = u ? all.filter(x=>x.user===u.email) : []
    if(list.length===0){if(historyList) historyList.innerHTML='<div class="muted">No bookings yet. Book a trip to see it here.</div>';return}
    list.forEach(b=>{
      const el = document.createElement('div');el.className='history-item'
      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">${b.offer.carrier} • ${b.transport.toUpperCase()}</div>
            <div class="small muted">${b.offer.from} → ${b.offer.to} • ${new Date(b.createdAt).toLocaleString()}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700">₹${b.offer.price}</div>
            <button class="btn ghost" data-id="${b.id}">Cancel</button>
          </div>
        </div>
      `
      if(historyList) historyList.appendChild(el)
      const btn = el.querySelector('button')
      if(btn) btn.addEventListener('click', ()=>{ if(confirm('Cancel booking '+b.id+'?')){ cancelBooking(b.id) }})
    })
  }

  function cancelBooking(id){
    let all = storage.loadBookings()
    all = all.filter(x=>x.id!==id)
    storage.saveBookings(all)
    renderHistory()
  }

  // Expose a tiny test helper in dev console to quickly reset storage during testing
  window.__QuickTickets = {
    resetDemoData: ()=>{localStorage.removeItem(storage.usersKey); localStorage.removeItem(storage.bookingsKey); localStorage.removeItem(storage.currentUserKey); alert('Demo data cleared')}
  }


});
