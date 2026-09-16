const WebSocket = require('ws')
const ws = new WebSocket(process.argv[2])
let id = 0; const pending = new Map()
function send(method, params={}){const m=++id;return new Promise((res,rej)=>{pending.set(m,{res,rej});ws.send(JSON.stringify({id:m,method,params}))})}
function ev(expr){return send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true}).then(r=>{const v=r.result?.value;const e=r.exceptionDetails?.exception?.description;return e?{__err:String(e).split('\n')[0]}:(v===undefined?'<undef>':v)})}
ws.on('open', async () => {
  await send('Runtime.enable')
  await ev("window.location.hash = '/settings'")
  await new Promise(r=>setTimeout(r,1200))
  const found = await ev(`(()=>{
    const btns = Array.from(document.querySelectorAll('button, [role=button]'));
    const connect = btns.find(b => (b.textContent||'').includes('Connect') && (b.textContent||'').includes('Google'));
    return {ok:!!connect, text: connect?connect.textContent.trim().slice(0,60):null};
  })()`)
  console.log('find connect:', JSON.stringify(found))
  if (found.ok) {
    await ev(`(()=>{
      const btns = Array.from(document.querySelectorAll('button, [role=button]'));
      const connect = btns.find(b => (b.textContent||'').includes('Connect') && (b.textContent||'').includes('Google'));
      connect.click();
      return {clicked:true};
    })()`)
    console.log('clicked connect')
    await new Promise(r=>setTimeout(r,3500))
  }
  ws.close(); process.exit(0)
})
ws.on('message', d => { const m = JSON.parse(d.toString()); if (m.id && pending.has(m.id)) { const {res,rej} = pending.get(m.id); pending.delete(m.id); if (m.error) rej(m.error); else res(m.result) } })
ws.on('error', e => { console.error(e.message); process.exit(1) })
