export type Question = {text:string; options:string[]; correct:number[]; points:number};
export function grade(questions:Question[], answers:{question:number;selected:number[]}[]) {
 const answerMap = new Map(answers.map(a=>[a.question, a.selected]));
 if (answerMap.size !== answers.length || answers.some(a=>a.question>=questions.length || new Set(a.selected).size!==a.selected.length || a.selected.some(i=>i>=questions[a.question].options.length))) throw new Error('Invalid answers.');
 let earned=0;
 for (const [index,q] of questions.entries()) {
  const selected=answerMap.get(index) ?? [];
  if (selected.length===q.correct.length && q.correct.every(i=>selected.includes(i))) earned+=q.points;
 }
 const total=questions.reduce((sum,q)=>sum+q.points,0);
 return {score:earned, percentage:Math.round(earned/total*10000)/100};
}
