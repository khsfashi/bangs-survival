module.exports=async function handler(req,res){
  if(req.method!=='POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'method_not_allowed'});
  }
  const body=req.body&&typeof req.body==='object'?req.body:{};
  const event=typeof body.event==='string'?body.event.slice(0,64):'unknown';
  const detail=typeof body.detail==='string'?body.detail.slice(0,240):'';
  console.log(`[client-diagnostic] ${event}${detail?` :: ${detail}`:''}`);
  return res.status(204).end();
};
