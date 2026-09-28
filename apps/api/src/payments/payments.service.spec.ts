import {PaymentsService,providerStatus} from './payments.service';
import {createHmac} from 'node:crypto';
describe('payments',()=>{
 const key='test-secret';let prisma:any;let service:PaymentsService;
 beforeEach(()=>{prisma={payment:{findUnique:jest.fn()},$transaction:jest.fn()};service=new PaymentsService(prisma,{get:()=>key} as any);});
 afterEach(()=>jest.restoreAllMocks());
 it.each([['pending','PROCESSING'],['ongoing','PROCESSING'],['failed','FAILED'],['abandoned','CANCELLED'],['success','SUCCESSFUL'],['reversed','REFUNDED']])('maps %s to %s',(a,b)=>expect(providerStatus(a)).toBe(b));
 it('verifies the exact raw body signature',()=>{const body=Buffer.from('{"event":"charge.success"}');const sig=createHmac('sha512',key).update(body).digest('hex');expect(service.verifyWebhookSignature(sig,body)).toBe(true);expect(service.verifyWebhookSignature(sig,Buffer.from('{}'))).toBe(false);expect(service.verifyWebhookSignature(sig+'zz',body)).toBe(false);expect(service.verifyWebhookSignature(undefined,body)).toBe(false);});
 it('rejects another account payment',async()=>{prisma.payment.findUnique.mockResolvedValue({userId:'owner'});await expect(service.verifyCoursePayment('intruder','ref')).rejects.toThrow();});
 const payment={id:'p',userId:'u',provider:'PAYSTACK',providerReference:'ref',amountMinor:1000n,currency:'NGN',status:'PENDING',items:[{itemType:'COURSE',referenceId:'c'}]};
 function provider(status:string,amount:number=1000){jest.spyOn(global,'fetch').mockResolvedValue({ok:true,json:async()=>({status:true,data:{status,amount,currency:'NGN',reference:'ref'}})} as Response);}
 it('rejects a mismatched amount before fulfillment',async()=>{prisma.payment.findUnique.mockResolvedValue(payment);provider('success',1);await expect(service.verifyAndFulfil('ref')).rejects.toThrow('does not match');expect(prisma.$transaction).not.toHaveBeenCalled();});
 it.each(['pending','failed','abandoned'])('does not enroll on %s',async status=>{
  prisma.payment.findUnique.mockResolvedValue(payment);provider(status);
  const tx={...prisma,$executeRaw:jest.fn(),payment:{findUniqueOrThrow:jest.fn().mockResolvedValue(payment),update:jest.fn()},enrollment:{upsert:jest.fn()},auditLog:{create:jest.fn()}};
  prisma.$transaction.mockImplementation((f:any)=>f(tx));const result=await service.verifyAndFulfil('ref');expect(result.status).toBe(providerStatus(status));expect(tx.enrollment.upsert).not.toHaveBeenCalled();
 });
 it('replayed success preserves completed enrollment',async()=>{
  prisma.payment.findUnique.mockResolvedValue({...payment,status:'SUCCESSFUL'});provider('success');
  const tx={$executeRaw:jest.fn(),payment:{findUniqueOrThrow:jest.fn().mockResolvedValue({...payment,status:'SUCCESSFUL'}),update:jest.fn()},enrollment:{findUnique:jest.fn().mockResolvedValue({id:'e',status:'COMPLETED'}),upsert:jest.fn()}};
  prisma.$transaction.mockImplementation((f:any)=>f(tx));expect((await service.verifyAndFulfil('ref')).enrollmentId).toBe('e');expect(tx.enrollment.upsert).not.toHaveBeenCalled();expect(tx.payment.update).not.toHaveBeenCalled();
 });
 it('does not reactivate refunded payments',async()=>{prisma.payment.findUnique.mockResolvedValue({...payment,status:'REFUNDED'});const result=await service.verifyAndFulfil('ref');expect(result.status).toBe('REFUNDED');expect(prisma.$transaction).not.toHaveBeenCalled();});
});
