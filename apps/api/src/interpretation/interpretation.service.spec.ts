import {InterpretationService} from './interpretation.service';
describe('interpretation authorization',()=>{
 let tx:any;let service:InterpretationService;
 beforeEach(()=>{tx={$executeRaw:jest.fn(),interpretationBooking:{findUnique:jest.fn().mockResolvedValue({id:'b',customerId:'customer',interpreterId:'worker',status:'REQUESTED'}),update:jest.fn()},auditLog:{create:jest.fn()}};service=new InterpretationService({$transaction:async(f:any)=>f(tx)} as any);});
 it('rejects unrelated users',async()=>{await expect(service.manage('b','stranger',['STUDENT'],{action:'cancel'})).rejects.toThrow();expect(tx.interpretationBooking.update).not.toHaveBeenCalled();});
 it('does not let customers set their own price',async()=>{await expect(service.manage('b','customer',['STUDENT'],{action:'quote',amountMinor:'1',currency:'NGN'})).rejects.toThrow();});
 it('requires payment confirmation before assignment',async()=>{await expect(service.manage('b','admin',['ADMIN'],{action:'assign',interpreterId:'worker'})).rejects.toThrow();});
 it('does not let specialists accept their own delivery',async()=>{tx.interpretationBooking.findUnique.mockResolvedValue({customerId:'customer',interpreterId:'worker',status:'DELIVERED'});await expect(service.manage('b','worker',['INTERPRETER'],{action:'complete'})).rejects.toThrow();});
 it('allows customer to accept delivered work and records audit',async()=>{tx.interpretationBooking.findUnique.mockResolvedValue({customerId:'customer',status:'DELIVERED'});await service.manage('b','customer',['STUDENT'],{action:'complete'});expect(tx.interpretationBooking.update).toHaveBeenCalledWith({where:{id:'b'},data:{status:'COMPLETED'}});expect(tx.auditLog.create).toHaveBeenCalled();});
});
