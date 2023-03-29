# -*- coding: utf-8 -*-

# https://jollytoday.feishu.cn/docx/T971dwGEko0Q6PxN24DcWQOKnQf

import requests
import hashlib
import json
from sign import get_sign

url="https://api.zhaoli.com/v-w-c/gateway/ve/work/translation"
body=json.dumps({
    "urls": ["http://xxx/yyy.mp4"],
    "voice": 1,
    "wyVoiceParam": 62,
    "lang": "en",
    "sourceLang": "zh",
    "removeBgAudio": 1,
    "needChineseOcclude": 1,
    "needTrim": 0,
    "needMask": 0,
    "needMirror": 0,
    "needRescale": 0,
    "music": 0,
    "musicRegion": "",
    "resolution": 1,
    "callback": ""
})

sign = get_sign(body)

print(sign)
headers = {
    'Content-type': 'application/json',
    'AppKey': appKey,
    'AppSign': sign,
}

result=requests.post(url, data=body, headers= headers).json()

# {"code":1000,"msg":"success","body":"ok"}
print(result)