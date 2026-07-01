const CONFIG={MAP_CENTER:[13.784,121.1],MAP_ZOOM:14,BASE_FARE:50,PER_KM:15,WAITING_RATE:3,FREE_WAIT_SECONDS:300,AUTO_REJECT_SECONDS:10};
let map,marker,isOnline=false,onTrip=false,isVerified=false,current=null,earnings=0,waitT=null,waitS=0,queue=[],uid;
let unsubBooking; // BAGO: Para sa realtime listener

// BAGO: AUTO LOGIN CHECK
window.onAuth(auth, async user=>{
  if(user){
    uid=user.uid;
    const snap=await window.getDoc(window.doc(db,'riders',uid));
    const data=snap.data();
    isVerified=data?.verified||false;
    document.getElementById('riderName').textContent=data?.name||'Kuya Rider';
    document.getElementById('loginScreen').style.display='none';
    if(isVerified){document.getElementById('app').style.display='block';initMap();listenBookings();}
    else{document.getElementById('pendingScreen').style.display='flex';}
  }
});

async function login(){
  const e=document.getElementById('email').value;
  const p=document.getElementById('pass').value;
  try{await window.signIn(auth,e,p);}catch(err){alert(err.message);}
}
function logout(){window.signOut(auth);location.reload();}

function initMap(){map=L.map('map').setView(CONFIG.MAP_CENTER,CONFIG.MAP_ZOOM);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);marker=L.marker(CONFIG.MAP_CENTER).addTo(map);navigator.geolocation?.watchPosition(p=>{marker.setLatLng([p.coords.latitude,p.coords.longitude]);map.setView([p.coords.latitude,p.coords.longitude]);if(isOnline){window.updateDoc(window.doc(db,'riders',uid),{lat:p.coords.latitude,lng:p.coords.longitude,online:true});}});}

async function toggleOnline(){
  isOnline=!isOnline;
  const b=document.getElementById('toggleBtn');
  b.className='toggle '+(isOnline?'online':'offline');
  b.textContent=isOnline?'ONLINE':'OFFLINE';
  document.getElementById('riderStatus').textContent=isOnline?'Available':'Offline';
  await window.updateDoc(window.doc(db,'riders',uid),{online:isOnline});
}

// BAGO: REALTIME BOOKING GALING FIRESTORE. WALA NG WEBSOCKET
function listenBookings(){
  unsubBooking=window.onSnap(window.doc(db,'bookings',uid),snap=>{
    if(snap.exists()){
      const b=snap.data();
      if(b.status==='assigned'&&!onTrip){show(b);}
    }
  });
}

function calc(km,rt){let f=CONFIG.BASE_FARE+km*CONFIG.PER_KM;return Math.round(rt?f*2:f);}
function show(b){if(onTrip){queue.push(b);return;}current=b;document.getElementById('popupTitle').textContent='New '+(b.rt?'Round Trip':'Transport');document.getElementById('popupBody').innerHTML=`From: ${b.from}<br>To: ${b.to}<br>Km: ${b.km}<br><b>Fare: ₱${b.fare}</b>`;document.getElementById('popup').classList.add('show');setTimeout(()=>{if(document.getElementById('popup').classList.contains('show'))rejectBooking();},CONFIG.AUTO_REJECT_SECONDS*1000);}

async function acceptBooking(){
  document.getElementById('popup').classList.remove('show');
  onTrip=true;document.getElementById('riderStatus').textContent='On Trip';
  document.getElementById('arriveBtn').style.display='block';
  await window.updateDoc(window.doc(db,'bookings',uid),{status:'accepted'});
}

async function rejectBooking(){
  document.getElementById('popup').classList.remove('show');
  await window.updateDoc(window.doc(db,'bookings',uid),{status:'rejected'});
  current=null;
}

async function arrived(){
  document.getElementById('arriveBtn').style.display='none';
  document.getElementById('endBtn').style.display='block';
  document.getElementById('riderStatus').textContent='Waiting...';
  waitT=setInterval(()=>waitS++,1000);
  await window.updateDoc(window.doc(db,'bookings',uid),{status:'arrived'});
}

async function endTrip(){
  onTrip=false;document.getElementById('riderStatus').textContent='Available';
  document.getElementById('endBtn').style.display='none';
  let total=current.fare;if(waitS>CONFIG.FREE_WAIT_SECONDS){total+=Math.floor((waitS-CONFIG.FREE_WAIT_SECONDS)/60)*CONFIG.WAITING_RATE;}
  earnings+=total;document.getElementById('earnings').textContent=earnings.toFixed(2);
  await window.updateDoc(window.doc(db,'bookings',uid),{status:'done',total,earnings});
  await window.updateDoc(window.doc(db,'riders',uid),{earnings});
  current=null;clearInterval(waitT);waitS=0;
  if(queue.length){setTimeout(()=>show(queue.shift()),1000);}
}

if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js');}
