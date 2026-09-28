'use client';
import {useState} from 'react';
import {apiRequest} from '../lib/api';
export default function LessonUpload({lessonId}:{lessonId:string}) {
 const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 return <form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;setBusy(true);try{await apiRequest('/lessons/'+lessonId+'/materials',{method:'POST',body:new FormData(form)});setMessage('Material uploaded.');form.reset();}catch(e){setMessage(e instanceof Error?e.message:'Upload failed.');}finally{setBusy(false);}}}><label>Lesson material (up to 50 MB)<input name="file" type="file" accept=".mp4,.webm,.mp3,.wav,.ogg,.pdf,.png,.jpg,.jpeg" required/></label><button className="button-outline" disabled={busy}>{busy?'Uploading…':'Upload material'}</button><p role="status">{message}</p></form>;
}
