'use client';
import {useEffect,useState} from 'react';
import {apiRequest} from '../lib/api';
type Assessment={id:string;title:string;lessonId:string|null;maxAttempts:number;durationMinutes:number|null;passPercentage:number;questions:{text:string;options:string[];points:number}[];attempts:{id:string;passed:boolean|null;percentage:number|null;submittedAt:string|null}[]};
export default function AssessmentPlayer({courseId,lessonId}:{courseId:string;lessonId?:string}) {
 const [items,setItems]=useState<Assessment[]>([]);const [error,setError]=useState('');
 const load=()=>apiRequest<Assessment[]>('/courses/'+courseId+'/assessments').then(setItems).catch(e=>setError(e.message));
 useEffect(()=>{void load();},[courseId]);
 return <section><p role="alert">{error}</p>{items.filter(a=>lessonId?a.lessonId===lessonId:!a.lessonId).map(a=><Attempt key={a.id} item={a} refresh={load}/>)}</section>;
}
function Attempt({item,refresh}:{item:Assessment;refresh:()=>Promise<unknown>}) {
 const [attempt,setAttempt]=useState<{id:string;startedAt:string;durationMinutes:number|null}|null>(null);
 const [answers,setAnswers]=useState<Record<number,number[]>>({});const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 const passed=item.attempts.some(a=>a.passed);
 async function start(){setBusy(true);try{setAttempt(await apiRequest('/assessments/'+item.id+'/start',{method:'POST'}));await refresh();setMessage('');}catch(e){setMessage(e instanceof Error?e.message:'Unable to start.');}finally{setBusy(false);}}
 return <section className="form-card"><h3>{item.title}</h3><p>Pass mark: {item.passPercentage}% · {item.maxAttempts} attempts{item.durationMinutes?' · '+item.durationMinutes+' minutes':''}</p>{passed?<p className="form-success">Passed. You can complete this lesson or claim your course certificate after all requirements are met.</p>:!attempt?<button className="button" disabled={busy} onClick={start}>Start / resume assessment</button>:<form onSubmit={async e=>{e.preventDefault();setBusy(true);try{const result=await apiRequest<{passed:boolean;percentage:number}>('/assessment-attempts/'+attempt.id+'/submit',{method:'POST',body:JSON.stringify({answers:Object.entries(answers).map(([q,selected])=>({question:Number(q),selected}))})});setMessage((result.passed?'Passed: ':'Not passed: ')+result.percentage+'%');setAttempt(null);setAnswers({});await refresh();}catch(e){setMessage(e instanceof Error?e.message:'Could not submit.');}finally{setBusy(false);}}}>
 {attempt.durationMinutes&&<p>Submit before {new Date(new Date(attempt.startedAt).getTime()+attempt.durationMinutes*60000).toLocaleTimeString()}. Late submissions receive zero.</p>}
 {item.questions.map((q,i)=><fieldset key={i}><legend>{i+1}. {q.text} ({q.points} points)</legend><p>Select all correct answers.</p>{q.options.map((o,j)=><label key={j} className="checkbox-label"><input type="checkbox" checked={(answers[i]||[]).includes(j)} onChange={e=>setAnswers(a=>({...a,[i]:e.target.checked?[...(a[i]||[]),j]:(a[i]||[]).filter(v=>v!==j)}))}/>{o}</label>)}</fieldset>)}<button className="button" disabled={busy}>Submit answers</button></form>}<p role="status">{message}</p>{item.attempts.filter(a=>a.submittedAt).map(a=><p key={a.id}>Attempt: {a.percentage}% — {a.passed?'Passed':'Not passed'}</p>)}</section>;
}
