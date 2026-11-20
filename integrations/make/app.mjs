import contract from "../pipedream/contract.mjs";

const origin = "https://api.zhaoli.com";
const valid = {condition: "{{body.code === 1000}}", message: "Weydub {{body.code}}: {{body.msg}} (trace {{body.trace}}). Check your job before submitting it again."};
const log = {sanitize: ["request.headers.appkey", "request.headers.appsign", "request.body", "response.body"]};
export const base = {baseUrl: origin, log};
const expr = (s) => `{{${s}}}`;
const text = (v) => v === "image_url" || v === "video_url" ? "mediaUrl" : v === "source_language" ? "source" : "target";
const keyHeaders = (scope, wire = "temp.wire") => ({
  "Content-Type": "application/json",
  AppKey: expr(`${scope}.appKey`),
  AppSign: expr(`md5(join(add(emptyarray, md5(${wire}), ${scope}.appSecret), emptystring))`),
});
export const connection = {
  parameters: ["appKey", "appSecret"].map((name) => ({name, type: "password", required: true, label: name === "appKey" ? "App Key" : "App Secret"})),
  communication: {
    url: `${origin}/v-w-c/gateway/ve/point/query`, method: "POST", type: "raw",
    temp: {wire: '{"notZero":true,"isValid":true}'}, headers: keyHeaders("parameters"), body: "{{temp.wire}}",
    response: {valid, data: {appKey: "{{parameters.appKey}}", appSecret: "{{parameters.appSecret}}"}}, log,
  },
};

function payload(op) {
  if (op === "image-status") return {id:"{{parameters.jobId}}"};
  if (op === "video-status") return {idWorks:["{{parameters.jobId}}"]};
  const body = structuredClone(contract[op].body);
  // The image API expects a JSON-encoded string, not a nested Make collection.
  if (op === "image") body.downloadInfo = JSON.stringify({url:"{{parameters.mediaUrl}}"});
  for (const [key,value] of Object.entries(body)) {
    if (key === "urls") body.urls = ["{{parameters.mediaUrl}}"];
    else if (typeof value === "string" && /^\{\{\w+\}\}$/.test(value)) body[key] = expr(`parameters.${text(value.slice(2,-2))}`);
  }
  return body;
}
const string = (name, label, help) => ({name, label, help, type: "text", required: true});
const names = {
  erase: ["removeBurnedInSubtitles", "Remove Burned-In Subtitles", "Removes subtitles in the bottom 18% of a video with the Lite model."],
  ocr: ["extractVisibleSubtitles", "Extract Visible Subtitles", "Reads the whole frame and returns a job for a timed subtitle file."],
  dub: ["translateAndDubVideo", "Translate and Dub a Video", "Translates spoken dialogue and dubs the video using the high-emotion voice model."],
  image: ["translateImage", "Translate an Image", "Translates printed text and renders it back into an image."],
  "video-status": ["getVideoResult", "Get a Video or Subtitle Result", "Retrieves a cleaned video, dubbed video or SRT for an existing work ID."],
  "image-status": ["getImageResult", "Get an Image Result", "Retrieves the translated image for an existing image job."],
};
export function makeModule(op) {
  const [name, label, description] = names[op];
  const lookup = op.endsWith("-status"), img = op.startsWith("image");
  const mappable = lookup ? [{name: "jobId", type: "uinteger", label: "Job ID", required: true, validate: {min: 1}}] :
    [{...string("mediaUrl", img ? "Image URL" : "Video URL", img ? "Use a direct HTTPS link to a file you have permission to process. Percent-encode spaces, quotes and backslashes." : "Use a direct HTTPS link to a file you have permission to process."), type: "url", validate: {pattern: img ? '^https://[^\\s"\\\\]+$' : "^https://"}},
      ...(op !== "erase" ? [string("source", op === "dub" ? "Spoken language" : "Visible text language", "Enter the source language code, for example zh or en.")] : []),
      ...(op === "image" || op === "dub" ? [string("target", "Target language", "Enter the output language code, for example en.")] : []),
      {name:"submit", type:"boolean", label:"Submit billable job", default:false, help:"Leave off for a preview. Turn on to process one file with this connection's Weydub credits."}];
  const wire = "createJSON(temp.payload)";
  const communication = {url:contract[op].path, method:"POST", type:"raw", temp:{payload:payload(op)}, headers:keyHeaders("connection",wire), body:expr(wire), response:{valid}};
  let fields;
  if (lookup && img) {
    // createJSON normalizes both response shapes before parsing only a nested string.
    const result = `if(substring(createJSON(body.body.result), 0, 1) === "{", body.body.result, parseJSON(body.body.result))`;
    communication.response.temp = {result:expr(`if(body.body.status === 1, ${result}, emptycollection)`)};
    communication.response.valid = {condition:"{{body.code === 1000 && body.body.id == parameters.jobId}}",message:"{{if(body.code === 1000, 'No image matches this job ID. For a video or SRT, use Get a Video or Subtitle Result. For an image, check the ID and connection.', body.msg)}} (Weydub {{body.code}}, trace {{body.trace}})."};
    communication.response.output = {jobId:"{{parameters.jobId}}", status:"{{body.body.status}}", statusMessage:"{{ifempty(body.body.taskStatusEnum.descriptionEn, body.body.taskStatusEnum.description)}}", trace:"{{body.trace}}", imageUrl:"{{temp.result.output_url}}", cleanBackgroundUrl:"{{temp.result.inpaint_url}}"};
    fields = ["imageUrl","cleanBackgroundUrl"];
  } else if (lookup) {
    // The query is for one work ID. Do not publish a result from an unrelated record.
    communication.response.valid = {condition:"{{body.code === 1000 && get(first(body.body.content), 'id') == parameters.jobId}}",message:"No matching video work. Weydub {{body.code}} (trace {{body.trace}})."};
    communication.response.temp = {work:"{{first(body.body.content)}}"};
    fields = ["videoUrl","sourceSrtUrl","translatedSrtUrl"];
    communication.response.output = {jobId:"{{parameters.jobId}}",status:"{{temp.work.processStatus}}",...Object.fromEntries(fields.map((f,i)=>[f,expr(`if(temp.work.processStatus === 1, temp.work.${["videoUrl","srcSrtUrl","tgtSrtUrl"][i]}, null)`) ]))};
  } else {
    communication.condition = {condition:"{{parameters.submit === true}}",default:{state:"preview",...(img ? {requestPreview:payload(op)} : {})}};
    communication.response.output = {state:"accepted",jobId:img?"{{body.body}}":"{{get(first(body.body.dataList), 'id')}}"};
    fields = [];
  }
  const output = [{name:"jobId",type:"number",label:"Job ID"}, lookup ? {name:"status",type:"number",label:"Processing status"} : {name:"state",type:"text",label:"Submission state"}, ...(lookup && img ? [{name:"statusMessage",type:"text",label:"Processing message"},{name:"trace",type:"text",label:"Support trace"}] : []), ...fields.map(f=>({name:f,type:"url",label:{imageUrl:"Translated image URL",cleanBackgroundUrl:"Clean background URL",videoUrl:"Video URL",sourceSrtUrl:"Source SRT URL",translatedSrtUrl:"Translated SRT URL"}[f]}))];
  if (op === "image") output.push({name:"requestPreview",type:"collection",label:"Request preview (no submission)"});
  return {name,label,description,mappable,communication,interface:output};
}
export const modules = Object.fromEntries(Object.keys(names).map(op=>[op,makeModule(op)]));

// The fixed prefix and disabled redirects keep connection headers on the signed media gateway.
const gateway = `${origin}/v-w-c/gateway/ve/`;
export const universal = {
  name:"makeApiCall", label:"Make an API call", description:"Performs an arbitrary authorized API call.",
  mappable:[
    {name:"path", label:"URL", type:"text", required:true, default:"/point/query",
      help:`Enter a path relative to ${gateway.slice(0,-1)}, for example /point/query. Use the JSON POST endpoints from the Weydub API guide.`,
      validate:{pattern:"^/[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*$"}},
    {name:"jsonBody", label:"JSON body", type:"text", required:true, default:'{"notZero":true,"isValid":true}',
      help:"The default body checks your balance. Creating media jobs with other endpoints can use Weydub credits."},
  ],
  communication:{
    url:`${gateway}{{substring(parameters.path, 1)}}`, method:"POST", type:"raw",
    followRedirects:false, followAllRedirects:false,
    temp:{wire:"{{createJSON(parseJSON(parameters.jsonBody))}}"}, headers:keyHeaders("connection"), body:"{{temp.wire}}",
    response:{valid,output:{body:"{{body}}",statusCode:"{{statusCode}}"}}, log,
  },
  interface:[{name:"body",type:"any",label:"Body"},{name:"statusCode",type:"number",label:"HTTP status code"}],
};
