'use strict';
class WeydubApi {
  name='weydubApi';
  displayName='Weydub API';
  documentationUrl='https://weydub.com/docs/api/';
  properties=[
    {displayName:'App Key',name:'appKey',type:'string',typeOptions:{password:true},default:'',required:true},
    {displayName:'App Secret',name:'appSecret',type:'string',typeOptions:{password:true},default:'',required:true},
  ];
}
module.exports={WeydubApi};
