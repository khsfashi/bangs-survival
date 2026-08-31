function getKakaoJavaScriptKey(env=process.env){return env.KAKAO_JAVASCRIPT_KEY||env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY||env.NEXT_PUBLIC_KA_KAO_MAP_CLIENT_KEY||env.NEXT_PUBLIC_KAKAO_MAP_CLIENT_KEY||'';}
module.exports=function handler(req,res){if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'method_not_allowed'});}res.setHeader('Cache-Control','public, max-age=300');return res.status(200).json({kakaoJavaScriptKey:getKakaoJavaScriptKey(),kmaConfigured:Boolean(process.env.KMA_API_KEY)});};
module.exports.getKakaoJavaScriptKey=getKakaoJavaScriptKey;
