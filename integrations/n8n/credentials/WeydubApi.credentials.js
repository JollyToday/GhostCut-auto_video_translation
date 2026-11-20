'use strict';
const {createHash}=require('node:crypto');
const endpoints=new Set(Object.values(require('../contract.json')).map(op=>'https://api.zhaoli.com'+op.path));
class WeydubApi {
  name='weydubApi';
  displayName='Weydub API';
  documentationUrl='https://weydub.com/docs/api/';
  properties=[
    {displayName:'App Key',name:'appKey',type:'string',typeOptions:{password:true},default:'',required:true},
    {displayName:'App Secret',name:'appSecret',type:'string',typeOptions:{password:true},default:'',required:true},
  ];
  async authenticate(credentials,request) {
    if(request.method!=='POST' || !endpoints.has(request.url) || typeof request.body!=='string')
      throw Error('Weydub credentials require a supported API endpoint and a JSON request body.');
    if(!credentials.appKey || !credentials.appSecret)throw Error('Set an App Key and App Secret in the Weydub credential.');
    const md5=s=>createHash('md5').update(s).digest('hex');
    return {...request,disableFollowRedirect:true,headers:{...request.headers,
      AppKey:credentials.appKey,AppSign:md5(md5(request.body)+credentials.appSecret)}};
  }
}
module.exports={WeydubApi};
