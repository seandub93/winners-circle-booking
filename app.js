// Winners Circle Barbershop booking config
const CONFIG = {
  slotLengthMinutes: 15,
  services: [
    { id: 'mens', name: "Men's Cut", duration: 45, price: 45 },
    { id: 'mens_beard', name: "Men's Cut w/ Beard", duration: 60, price: 50 },
    { id: 'kids', name: "Kids Cut", duration: 30, price: 30 },
    { id: 'shapeup', name: "Shape Up", duration: 20, price: 20 },
    { id: 'design', name: "Full Cut w/ Design", duration: 75, price: 60 }
  ],
  staff: [
    { id: 'sean', name: 'Sean Whiddon' }
  ],
  hours: {
    mon: [16,20],
    tue: [16,20],
    wed: null,
    thu: [10,18],
    fri: [10,18],
    sat: [7,13],
    sun: [11,13]
  }
};

const $ = (s)=>document.querySelector(s);
const getBookings=()=>JSON.parse(localStorage.getItem('bp_bookings')||'[]');
const saveBookings=b=>localStorage.setItem('bp_bookings',JSON.stringify(b));

function toISODateLocal(d){const t=new Date(d.getTime()-d.getTimezoneOffset()*60000);return t.toISOString().slice(0,10);}
function weekday(dateStr){return ['sun','mon','tue','wed','thu','fri','sat'][new Date(dateStr).getDay()];}

function generateSlotsFor(dateStr, serviceDuration, staffId){
  const wd = weekday(dateStr);
  const hours = CONFIG.hours[wd];
  if(!hours) return [];
  const slots=[];
  const [open,close]=hours;
  const [y,m,d]=dateStr.split('-').map(Number);
  const start=new Date(y,m-1,d,open,0,0);
  const end=new Date(y,m-1,d,close,0,0);
  let cursor=new Date(start);
  while(cursor.getTime()+serviceDuration*60000<=end.getTime()){
    const s={start:new Date(cursor).toISOString(), end:new Date(cursor.getTime()+serviceDuration*60000).toISOString(), staffId};
    slots.push(s);
    cursor.setMinutes(cursor.getMinutes()+CONFIG.slotLengthMinutes);
  }
  const bookings=getBookings();
  return slots.map(s=>{
    const overlap=bookings.find(b=>b.staffId===staffId&&b.date===dateStr&&s.start<b.end&&s.end>b.start);
    return {...s,taken:!!overlap};
  });
}

function formatTime(iso){return new Date(iso).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}

function populateOptions(){
  const sSel=$('#serviceSelect');
  CONFIG.services.forEach(s=>{
    const o=document.createElement('option');
    o.value=s.id;o.textContent=`${s.name} — ${s.duration}m $${s.price}`;
    sSel.appendChild(o);
  });
}

function showSlots(){
  const date=$('#dateInput').value;
  const serviceId=$('#serviceSelect').value;
  const slotsC=$('#slots'); slotsC.innerHTML='';
  if(!date||!serviceId)return;
  const service=CONFIG.services.find(s=>s.id===serviceId);
  const slots=generateSlotsFor(date,service.duration,'sean');
  slots.forEach(s=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='slot'+(s.taken?' taken':''); btn.textContent=formatTime(s.start)+' — '+formatTime(s.end);
    btn.dataset.start=s.start;btn.dataset.end=s.end;if(s.taken)btn.disabled=true;
    btn.addEventListener('click',()=>{document.querySelectorAll('.slot').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');});
    slotsC.appendChild(btn);
  });
}

function renderUpcoming(){
  const ul=$('#upcoming');
  const bookings=getBookings().filter(b=>new Date(b.start)>=new Date()).sort((a,b)=>new Date(a.start)-new Date(b.start)).slice(0,8);
  ul.innerHTML='';
  if(bookings.length===0){ul.textContent='No upcoming bookings.';return;}
  bookings.forEach(b=>{
    const div=document.createElement('div');div.className='upcoming-item';
    const svc=CONFIG.services.find(s=>s.id===b.serviceId).name;
    const time=new Date(b.start).toLocaleString();
    div.innerHTML=`<strong>${b.name}</strong><br>${svc} with Sean Whiddon<br><small>${time}</small>`;
    ul.appendChild(div);
  });
}

function confirmBooking(){
  const name=$('#nameInput').value.trim();
  const contact=$('#contactInput').value.trim();
  const selected=document.querySelector('.slot.selected');
  if(!name||!contact||!selected){showMessage('Please complete name/contact and choose a free timeslot.');return;}
  const serviceId=$('#serviceSelect').value;
  const date=$('#dateInput').value;
  const start=selected.dataset.start;const end=selected.dataset.end;
  const bookings=getBookings();
  const overlap=bookings.find(b=>b.staffId==='sean'&&b.date===date&&(start<b.end&&end>b.start));
  if(overlap){showMessage('Sorry — that time was just taken. Refreshing slots.');showSlots();return;}
  const id='b_'+Math.random().toString(36).slice(2,9);
  bookings.push({id,name,contact,serviceId,staffId:'sean',date,start,end,created:new Date().toISOString()});
  saveBookings(bookings);
  showMessage('Booking confirmed! Reference: '+id,true);
  document.querySelectorAll('.slot').forEach(x=>x.classList.remove('selected'));
  renderUpcoming();
}

function showMessage(text,ok=false){
  const m=$('#message');m.textContent=text;m.style.display='block';
  if(ok){m.style.background='#eef9f2';m.style.color='#064e2d';}else{m.style.background='#fff3cd';m.style.color='#7a5300';}
  setTimeout(()=>{m.style.display='none';},6000);
}

document.addEventListener('DOMContentLoaded',()=>{
  populateOptions();
  $('#dateInput').value=toISODateLocal(new Date());
  $('#dateInput').addEventListener('change',showSlots);
  $('#serviceSelect').addEventListener('change',showSlots);
  $('#confirmBtn').addEventListener('click',confirmBooking);
  renderUpcoming();showSlots();
});
