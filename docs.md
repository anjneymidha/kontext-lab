<aside>
⚠️ This is an early release and far from perfect, so you will still see failure cases from time to time - the model will be continuously improved and updated in the next week.

</aside>

# Our newest AI model for image editing.

 maintains character and object consistency across different scenes, allowing you to place the same person or object in multiple novel environments or scenes, while preserving (almost) perfectly their identity. Unlike other models, you don't need to fine-tune or create complex ComfyUI workflows to achieve this - Kontext handles it out of the box.

The model allows for precise edits, letting you modify specific parts of an image without affecting the rest. We've also put special focus on text capabilities, making Kontext effective at generating and editing text within images.

<aside>
💡

We will add **Text-to-Image capabilities soon** to Kontext! Allowing you to to generate entirely new images from text descriptions while enjoying Kontext's character and object consistency across different scenes.

</aside>

## Using Kontext API for Image Editing

Kontext is specialized in high-quality image editing. It **requires both** a **text prompt** and **an input image** to work, with the input image being the base that will be edited according to your prompt.

To use Kontext, you'll need to make a request to the `/flux-bagel-alpha` endpoint:

### Request

```bash
request=$(curl -X POST \
  'https://api.us1.bfl.ai/v1/flux-bagel-alpha' \
  -H 'accept: application/json' \
  -H "x-key: ${BFL_API_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "<What you want to edit on the image>",
    "input_image": "<base64 converted image>",
    "steps": 50,
    "guidance": 3.0
}')
echo $request
request_id=$(jq -r .id <<< $request)
```

### Python

```python
import os
import requests
import base64
from PIL import Image
from io import BytesIO

# Load and encode your image
image = Image.open("<your_image.jpg>")
buffered = BytesIO()
image.save(buffered, format="JPEG")
img_str = base64.b64encode(buffered.getvalue()).decode()

request = requests.post(
    'https://api.us1.bfl.ai/v1/flux-bagel-alpha',
    headers={
        'accept': 'application/json',
        'x-key': os.environ.get("BFL_API_KEY"),
        'Content-Type': 'application/json',
    },
    json={
        'prompt': '<What you want to edit on the image>',
        'input_image': img_str,
        'steps': 50,
        'guidance': 3.0,
    },
).json()

print(request)
request_id = request["id"]
```

## Poll the results

To get the result of your edit, you have to query the `get_result` endpoint. The example below assumes that the request id is stored in a `request_id` variable as it was done in the [previous step](https://www.notion.so/Alpha-Access-Flux-Kontext-API-1eec370222d5800da3fce6b850e6dc5d?pvs=21).

### Request

```bash
while true
do
  sleep 1.5
  result=$(curl -s -X 'GET' \
    "https://api.us1.bfl.ai/v1/get_result?id=${request_id}" \
    -H 'accept: application/json' \
    -H "x-key: ${BFL_API_KEY}")
  if [ "$( jq -r .status <<< $result )" == "Ready" ]
  then
    echo "Result: $(jq -r .result.sample <<< $result)"
    break
  else
    echo "Status: $(jq -r .status <<< $result)"
  fi
done
```

### Python

```python
import requests
import os
import time

request_id = "4409de50-d799-4245-b8f1-a29d09735b15"

while True:
    time.sleep(1.5)
    result = requests.get(
        'https://api.us1.bfl.ai/v1/get_result',
        headers={
            'accept': 'application/json',
            'x-key': os.environ.get("BFL_API_KEY"),
        },
        params={
            'id': request_id,
        },
    ).json()
    if result["status"] == "Ready":
        print(f"Result: {result['result']['sample']}")
        break
    else:
        print(f"Status: {result['status']}")
```

### Bagel Parameters

<aside>
💡

A guidance value that's too low will produce poor results. While a slightly lower value like 2.5 can work better for style references, style referencing generally isn't optimal yet.

Higher guidance values follow the prompt more closely but risk creating over-processed artifacts, particularly with human subjects or realistic artwork (such as oil paintings and sketches).

</aside>

List of Bagel parameters:

| Parameter | Description | Default | Range |
| --- | --- | --- | --- |
| `prompt` | Text description of what you want to generate | Required |  |
| `input_image` | Base64 encoded image to use as reference | Required |  |
| `seed` | Optional seed for reproducibility | None | Any integer |
| `guidance` | Controls adherence to prompt vs. original image | 3.0 | 0.1-99.0 |
| `steps` | Number of diffusion steps | 50 | 1-150 |
| `safety_tolerance` | Moderation level (0=strict, 6=permissive) | 2 | 0-6 |
| `output_format` | Format of the output image | "jpeg" | "jpeg" or "png" |
| `webhook_url` | URL for asynchronous completion notification | None | Valid URL |
| `webhook_secret` | Secret for webhook signature verification | None | String |

### Example Usage Scenarios

**Character Consistency:**
To maintain character identity across scenes, use a reference image and describe the new scene in your prompt. Note the strong preservation of the character from the input image

![*Input Image*](attachment:0a700b3c-f64a-4508-a2fe-d6524b00e110:image.png)

*Input Image*

![image.png](attachment:47a56b61-582f-46e2-8833-c17b75f5bd21:image.png)

![image.png](attachment:0b448273-9ce7-4d21-bbda-7c744edbfdd2:image.png)

![image.png](attachment:61bd1453-5bc3-4072-9d6d-1f35fbdffc6c:image.png)

**Style Transfer:**
To apply artistic styles, provide a reference image and describe the desired style in your prompt.

![*Prompt: Convert this to a Lego scene*](attachment:737c3701-d4e4-47b7-9144-f08e5b062885:image.png)

*Prompt: Convert this to a Lego scene*

![image.png](attachment:cf458157-34b0-4cc6-b41e-0885662080fd:image.png)

**Text Editing:**
For adding or modifying text in an image, provide the source image and describe the text changes in your prompt.

![*Prompt: Change “KELLAR” to “SUMITH”*](attachment:d7c0c064-7696-4606-87b4-d497e716ba43:image.png)

*Prompt: Change “KELLAR” to “SUMITH”*

![*Note the character consistency*](attachment:1382ed85-b5d0-43d3-a8ca-afe5c063928f:image.png)

*Note the character consistency*

**Iterative Editing:**

Use the output of one edit as the input for subsequent edits, allowing for step-by-step refinement of complex changes. This approach gives you more control and precision for  transformations.

[*Input Image*](https://lh7-rt.googleusercontent.com/slidesz/AGV_vUdzrIm6wcCNT-U1usINqeaJ1Y__5w8NhnGxgsSvhU06yurmxHzvrKvOPRn9LaZ5WnKA3jBCb_yMDK5GvjpJmgVOAsOMd2S-PMBA7mG4QYwwbF_w59F-JoSSU5IgAXLm1VnOm0X-=s2048?key=krINB5cIsrMcmoemPqkot78Z)

*Input Image*

[*Prompt: create a woven patch from it*](https://lh7-rt.googleusercontent.com/slidesz/AGV_vUenqcmTpNf4o8pxSh_IwPc659l5p5ihAcAcwNuX7ezZ5tNRFXoq0thiJsS6QWI_frDywpyLAp-J2iTJ_yj-LtNPC0X-JUDh8gnLl4je9w6gpLwZVMhsxvGTiGFCTPqeBDq9Xa6S=s2048?key=krINB5cIsrMcmoemPqkot78Z)

*Prompt: create a woven patch from it*

[*Prompt: Put this patch on a denim backpack on white background*](https://lh7-rt.googleusercontent.com/slidesz/AGV_vUe1Yjnm1_IK8jY-GSKSdMaoXLQsmZa03LstuA8NSDolMlb5bseATNuRS01C2jivw5U6PTKOAPTYSpk0TNoIxSKR2Jj1OaR1HDLib4trd8TpmBIuVpaqOgSprfJDihb7svFiL7DrCQ=s2048?key=krINB5cIsrMcmoemPqkot78Z)

*Prompt: Put this patch on a denim backpack on white background*

[*Prompt: A photograph taken of a teenager girl with this backpack on her back*](https://lh7-rt.googleusercontent.com/slidesz/AGV_vUdm6gdiCIWLqzIiJZpAtie5FBkXxtMgmcA9cVgROE-udWlVWkGO-VUHmLsHxCDcMO0yeuQW19rttwSMgE8zwulTN9RtnLAcRkk99JiPzdsTSQC5bX_5oGjyRaLX5pvgCI1ueNS3yQ=s2048?key=krINB5cIsrMcmoemPqkot78Z)

*Prompt: A photograph taken of a teenager girl with this backpack on her back*