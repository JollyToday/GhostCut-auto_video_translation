import {createHash} from 'node:crypto';
import type {ICredentialDataDecryptedObject, ICredentialTestRequest, ICredentialType, IHttpRequestOptions, INodeProperties} from 'n8n-workflow';
import contract from '../contract.json';

const endpoints=new Set(Object.values(contract).map(op=>'https://api.zhaoli.com'+op.path));
export const balanceUrl='https://api.zhaoli.com/v-w-c/gateway/ve/point/query';
endpoints.add(balanceUrl);
export class WeydubApi implements ICredentialType {
  name='weydubApi';
  displayName='Weydub API';
  icon='file:../nodes/Weydub/weydub.svg' as const;
  documentationUrl='https://weydub.com/docs/api/';
  properties: INodeProperties[]=[
    {displayName:'App Key',name:'appKey',type:'string',typeOptions:{password:true},default:'',required:true},
    {displayName:'App Secret',name:'appSecret',type:'string',typeOptions:{password:true},default:'',required:true},
  ];
  test:ICredentialTestRequest={
    request:{method:'POST',url:balanceUrl,body:{notZero:true,isValid:true},headers:{'Content-Type':'application/json'}},
    // The provider uses HTTP 200 for invalid keys too. A valid empty account returns an empty asset list.
    rules:[{type:'responseSuccessBody',properties:{key:'body.pointAssets',value:undefined,message:'Could not verify this App Key and App Secret.'}}],
  };
  async authenticate(credentials: ICredentialDataDecryptedObject,request: IHttpRequestOptions): Promise<IHttpRequestOptions> {
    if(request.method==='POST' && request.url===balanceUrl)request={...request,body:'{"notZero":true,"isValid":true}'};
    if(request.method!=='POST' || !endpoints.has(request.url) || typeof request.body!=='string')
      throw Error('Weydub credentials require a supported API endpoint and a JSON request body.');
    if(typeof credentials.appKey!=='string' || !credentials.appKey || typeof credentials.appSecret!=='string' || !credentials.appSecret)throw Error('Set an App Key and App Secret in the Weydub credential.');
    const md5=(s:string)=>createHash('md5').update(s).digest('hex');
    return {...request,disableFollowRedirect:true,headers:{...request.headers,
      AppKey:credentials.appKey,AppSign:md5(md5(request.body)+credentials.appSecret)}};
  }
}
