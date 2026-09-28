import {LearningService} from './learning.service';
describe('learning access',()=>{
 it('rejects course access without enrollment',async()=>{const p={enrollment:{findUnique:async()=>null}};await expect(new LearningService(p as any,{} as any).getCourse('student','course')).rejects.toThrow();});
 it('rejects completion until the quiz is passed',async()=>{const p={lesson:{findUnique:async()=>({id:'l',module:{courseId:'c'},lessonType:'QUIZ'})},enrollment:{findUnique:async()=>({id:'e',status:'ACTIVE'})},assessment:{findUnique:async()=>({id:'a',isPublished:true})},assessmentAttempt:{findFirst:async()=>null},$transaction:jest.fn()};await expect(new LearningService(p as any,{} as any).updateProgress('u','l',{progressPercentage:100,lastPositionSeconds:0})).rejects.toThrow('Pass');expect(p.$transaction).not.toHaveBeenCalled();});
});
