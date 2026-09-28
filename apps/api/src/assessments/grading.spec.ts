import {grade} from './grading';
describe('server grading',()=>{
 const q=[{text:'Select two',options:['a','b','c'],correct:[0,2],points:3},{text:'One',options:['a','b'],correct:[1],points:1}];
 it('requires the exact set; partial choices receive no credit',()=>expect(grade(q,[{question:0,selected:[0]},{question:1,selected:[1]}])).toEqual({score:1,percentage:25}));
 it('accepts correct choices in any order',()=>expect(grade(q,[{question:0,selected:[2,0]},{question:1,selected:[1]}]).percentage).toBe(100));
 it('rejects duplicate and unknown answers',()=>{expect(()=>grade(q,[{question:0,selected:[0,0]}])).toThrow();expect(()=>grade(q,[{question:9,selected:[0]}])).toThrow();expect(()=>grade(q,[{question:0,selected:[]},{question:0,selected:[]}])).toThrow();});
});
