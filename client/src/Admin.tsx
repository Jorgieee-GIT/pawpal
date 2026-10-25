import {useEffect,useState} from 'react';
import {ShieldCheck,Users,PawPrint,Search,LogOut,KeyRound,ArrowLeft,ArrowRight} from 'lucide-react';
import './Admin.css';
const API=import.meta.env.VITE_API_URL||'';
type AdminUser={id:string;username:string;created_at:string;pet_id:string|null;pet_name:string|null;species:string|null;level:number|null;coins:number|null};
async function adminRequest(path:string,token:string,method='GET',body?:object){
 const r=await fetch(API+'/api/admin'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
 const d=await r.json().catch(()=>({error:'Server returned an invalid response.'}));
 if(!r.ok)throw Error(d.error||'Request failed');
 return d;
}
export default function Admin(){
 const [token,setToken]=useState(()=>sessionStorage.getItem('pawpal-admin-token')||'');
 const [username,setUsername]=useState(''),[password,setPassword]=useState('');
 const [users,setUsers]=useState<AdminUser[]>([]),[overview,setOverview]=useState<{users:number;pets:number}|null>(null);
 const [search,setSearch]=useState(''),[page,setPage]=useState(1);
 const [resetId,setResetId]=useState<string|null>(null),[newPassword,setNewPassword]=useState('');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const logout=()=>{sessionStorage.removeItem('pawpal-admin-token');setToken('');setUsers([]);setOverview(null);setResetId(null)};
 async function load(t=token,q=search,p=page){
  try{const [u,o]=await Promise.all([adminRequest('/users?search='+encodeURIComponent(q)+'&page='+p,t),adminRequest('/overview',t)]);setUsers(u.users);setOverview(o)}
  catch(e){if(String(e).includes('session expired'))logout();setError((e as Error).message)}
 }
 useEffect(()=>{if(token)void load(token,search,page)},[token,search,page]);
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const d=await adminRequest('/login','', 'POST',{username,password});sessionStorage.setItem('pawpal-admin-token',d.token);setToken(d.token);setPassword('')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function reset(e:React.FormEvent){e.preventDefault();if(!resetId)return;setBusy(true);setError('');setMessage('');try{const d=await adminRequest('/users/'+resetId+'/reset-password',token,'POST',{newPassword});setMessage(d.message);setNewPassword('');setResetId(null)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <div className="admin-page"><div className="admin-shell"><header className="admin-header"><div className="admin-brand"><span><ShieldCheck size={22}/></span><div><b>PawPal Admin</b><small>Private management portal</small></div></div>{token&&<button type="button" onClick={logout}><LogOut size={16}/> Sign out</button>}</header>
 {!token?<main className="admin-login"><div className="admin-login-icon"><ShieldCheck size={34}/></div><h1>Administrator sign in</h1><p>Only the configured administrator credentials can access this page. Player accounts cannot sign in here.</p><form onSubmit={login}><label>Admin username<input autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)}/></label><label>Admin password<input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy} className="admin-primary">{busy?'Signing in…':'Sign in to admin'}</button></form></main>:
 <main className="admin-main"><div className="admin-heading"><div><span>ACCOUNT MANAGEMENT</span><h1>Dashboard</h1><p>Search player accounts and assist with password resets.</p></div></div><div className="admin-stats"><article><Users size={23}/><div><strong>{overview?.users??'—'}</strong><span>Registered players</span></div></article><article><PawPrint size={23}/><div><strong>{overview?.pets??'—'}</strong><span>Adopted pets</span></div></article></div><section className="admin-panel"><div className="admin-panel-head"><h2>Players</h2><div className="admin-search"><Search size={18}/><input aria-label="Search username" placeholder="Search by username" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></div></div><div className="admin-table-wrap"><table><thead><tr><th>Username</th><th>Pet</th><th>Level</th><th>Coins</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td><b>@{u.username}</b></td><td>{u.pet_name?u.pet_name+' · '+u.species:'No pet yet'}</td><td>{u.level??'—'}</td><td>{u.coins?.toLocaleString()??'—'}</td><td>{new Date(u.created_at).toLocaleDateString()}</td><td><button className="admin-reset" onClick={()=>{setResetId(u.id);setNewPassword('');setMessage('')}}><KeyRound size={15}/> Reset password</button></td></tr>)}</tbody></table>{!users.length&&<p className="admin-empty">No accounts found.</p>}</div><div className="admin-pages"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}><ArrowLeft size={15}/> Previous</button><span>Page {page}</span><button disabled={users.length<25} onClick={()=>setPage(p=>p+1)}>Next <ArrowRight size={15}/></button></div></section></main>}
 {error&&<div className="admin-toast error" role="alert">{error}<button onClick={()=>setError('')}>×</button></div>}{message&&<div className="admin-toast" role="status">{message}<button onClick={()=>setMessage('')}>×</button></div>}
 {resetId&&<div className="admin-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setResetId(null)}}><form className="admin-dialog" onSubmit={reset}><div className="admin-login-icon"><KeyRound size={26}/></div><h2>Reset player password</h2><p>Set a new temporary password for <b>@{users.find(u=>u.id===resetId)?.username}</b>. The original password cannot be viewed.</p><label>New password<input type="password" autoComplete="new-password" minLength={12} maxLength={100} required value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="At least 12 characters"/></label><div className="admin-dialog-actions"><button type="button" onClick={()=>setResetId(null)}>Cancel</button><button type="submit" className="admin-primary" disabled={busy}>{busy?'Saving…':'Reset password'}</button></div></form></div>}
 </div></div>
}
