export default {
  "erase": {
    "path": "/v-w-c/gateway/ve/work/free",
    "body": {
      "urls": [
        "{{video_url}}"
      ],
      "needChineseOcclude": 2,
      "videoInpaintLang": "all",
      "videoInpaintMasks": "[{\"type\":\"remove_only_ocr\",\"start\":0,\"end\":99999,\"region\":[[0,0.82],[1,0.82],[1,1],[0,1]]}]",
      "extraOptions": "{\"extra_inpaint_config\":{\"model\":\"advanced_lite\"}}"
    }
  },
  "ocr": {
    "path": "/v-w-c/gateway/ve/work/free",
    "body": {
      "urls": [
        "{{video_url}}"
      ],
      "needChineseOcclude": 14,
      "videoInpaintLang": "{{source_language}}",
      "lang": "{{source_language}}",
      "videoInpaintMasks": "[{\"type\":\"remove_only_ocr\",\"start\":0,\"end\":99999,\"region\":[[0,0],[1,0],[1,1],[0,1]]}]"
    }
  },
  "dub": {
    "path": "/v-w-c/gateway/ve/work/voice/incorporate",
    "body": {
      "urls": [
        "{{video_url}}"
      ],
      "sourceLang": "{{source_language}}",
      "lang": "{{target_language}}",
      "incorporatePro": true,
      "wyNeedText": 1
    }
  },
  "image": {
    "path": "/v-w-c/gateway/ve/image/translate",
    "body": {
      "downloadInfo": "{\"url\":\"{{image_url}}\"}",
      "translateOn": 1,
      "srcLang": "{{source_language}}",
      "tgtLang": "{{target_language}}",
      "commodityFilterOn": 0,
      "synthesisOn": 1
    }
  },
  "video-status": {
    "path": "/v-w-c/gateway/ve/work/status",
    "body": {
      "idWorks": [
        "{{video_work_id}}"
      ]
    }
  },
  "image-status": {
    "path": "/v-w-c/gateway/ve/image/translate/query",
    "body": {
      "id": "{{image_job_id}}"
    }
  }
};
