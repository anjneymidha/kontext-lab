# FLUX.1 Kontext - Image-to-Image Prompting Guide

<aside>
💡

Maximum prompt token is 512 tokens.

</aside>

*Kontext* makes editing images easy! Specify what you want to change and *Kontext* will follow. It is capable of understanding the context of the image, making it easier to edit them without having to describe in details what you want to do. 

## Basic Object Modifications

*Kontext* is really good at straightforward object modification, for example if we want to change the colour of an object, we can prompt it. 

![Input image](attachment:7c67b08b-9d89-410f-9e29-b3f6165ec254:pexels-jmark-253096.jpg)

Input image

![Prompt: “Change the car color to red”](attachment:a59623c6-5ba0-4542-a714-5caf653c1ea6:generation-3221b5dc-3fa1-4311-ad38-0bf2b85d7a72.png)

Prompt: “Change the car color to red”

## Prompt Precision: From Basic to Comprehensive

<aside>
💡

As a rule of thumb, making things more explicitly never hurts if the number of instructions per edit is not too complicated

</aside>

If you want to edit the image with more modifications, it is useful to be more explicit in your prompts to make sure you get the result you want. 

### Quick Edits

While using very simple prompts might yield some good results, it can also change the style of the input image. 

**Prompt: *“**Change to daytime”*

![Input image](attachment:b3288009-de8f-48ca-b873-191b7a8c3730:image.png)

Input image

![Output 1](attachment:9b265663-11b2-42c0-bf28-aaf1338aa95f:generation-462907f1-13d1-4143-8435-c9dc977a1dca.png)

Output 1

![Output 2](attachment:ffc82431-bf4b-487c-bdb1-b48b73460f16:generation-b76eafb9-beab-43b3-ae3e-0a221a0c0b6c.png)

Output 2

### Controlled Edits

If we add more instructions to our prompt, we can have results which are really similar to the input image. 

Prompt: *“Change to daytime while maintaining the same style of the painting”*

![Input image](attachment:b3288009-de8f-48ca-b873-191b7a8c3730:image.png)

Input image

![Output image](attachment:7da82e33-f6b2-48c0-b712-9431c98aee29:generation-d441dcb1-edc7-48b7-ad99-b3b4a03290fc.png)

Output image

### **Complex Transformations**

If you want to change multiple things on the input image, it is generally good to add as many details as possible as long as the instructions per edit aren’t too complicated. 

**Prompt**: *“change the setting to a day time, add a lot of people walking the sidewalk while maintaining the same style of the painting”*

![Input image](attachment:389a03dd-8ae6-4ce4-912b-775cc3416454:image.png)

Input image

![Output image](attachment:1190e1bb-f5eb-4ae2-86a4-261128b4d35d:image_(1).png)

Output image

## Style transfer

### Using prompts

When working on style transfer prompts, follow those principles: 

1. **Name the specific style**: Instead of vague terms like "make it artistic," specify exactly what style you want ("Transform to Bauhaus art style," "Convert to watercolor painting")
2. **Reference known artists or movements**: For more precise results, include recognizable style references ("Renaissance painting style”, "like a 1960s pop art poster")
3. **Detail the key characteristics**: If naming the style doesn’t work, it might be good to describe the visual elements that define the style:
    - "*Transform to oil painting with visible brushstrokes, thick paint texture, and rich color depth*"
4. **Preserve what matters**: Explicitly state what elements shouldn’t change:
    - "Change to Bauhaus art style while maintaining the original composition and object placement"

![Input image](attachment:bf012d07-bb61-41b4-9515-a152b044eef3:symmetric_.jpeg)

Input image

![**Prompt:** "*Convert to pencil sketch with natural graphite lines, cross-hatching, and visible paper texture*"](attachment:97eded70-8ae3-4f10-b641-778a64cf6f90:sample_(9).png)

**Prompt:** "*Convert to pencil sketch with natural graphite lines, cross-hatching, and visible paper texture*"

![**Prompt**: *“Transform to oil painting with visible brushstrokes, thick paint texture, and rich color depth"*](attachment:d58b4eb9-c322-44a2-8a0a-c86a2ddecd06:sample_(10).png)

**Prompt**: *“Transform to oil painting with visible brushstrokes, thick paint texture, and rich color depth"*

### Using Input image

<aside>
💡

**Note**: This technique works best with FLUX.1 Kontext pro. FLUX.1 Kontext dev may produce less consistent style matching when using input images as style references.

</aside>

You can also use input images as style references to generate new images. For example with the prompt: *“Using this style, a bunny, a dog and a cat are having a tea party seated around a small white table”* we get: 

![Input image](attachment:cf34b5c2-fc3b-4bfd-b3b6-5e5a9c35bd2e:image.png)

Input image

![image.png](attachment:b0dabd8d-0272-47e3-8634-23bd15201401:image.png)

![Input image](attachment:4a621a78-2399-48c3-9da9-f9b47ec9215e:image.png)

Input image

![image.png](attachment:c1ccc633-b6d3-4c15-8891-72e0b19e732c:image.png)

![Input image](attachment:2febe6e9-c4ba-48cb-a575-4c4a19324023:image.png)

Input image

![image.png](attachment:c0aa3f07-47f5-46d5-8e89-8615e5bdedc8:image.png)

### Transform images into different styles

*Kontext* lets you transform images in creative ways. On the example below, we restyle our photo into different visual styles and also doing different activities. 

If your goal is to dramatically change the input image, it is generally a good idea to do it step by step like the sequence below.

![Input image](attachment:c73bc779-a500-49ce-896d-2b371ce1cb54:image_(3).png)

Input image

![Prompt: *“Restyle to Claymation style”*](attachment:10cd677a-9876-41aa-b32c-6e8c82ebe9c4:image_(4).png)

Prompt: *“Restyle to Claymation style”*

![Prompt: "This character is now picking up weeds in a garden”](attachment:38fb74dd-751f-457a-9dab-d276898a8aee:image_(5).png)

Prompt: "This character is now picking up weeds in a garden”

## Iterative editing with Prompts while keeping Character Consistency

*Kontext* excels at character consistency, even after multiple edits. Starting from a reference picture, we can see that the character is consistent throughout the sequence.

![Input image](attachment:69af3775-f56e-4c2d-acfb-d27d1ed7eabc:input_1370997884060958771.webp)

Input image

![Prompt: “She's now taking a selfie in a street in Freiburg, it's a lovely day out”](attachment:6f98a844-9c4a-4855-9f7d-9260b6852b31:1370998373305548903_3.webp)

Prompt: “She's now taking a selfie in a street in Freiburg, it's a lovely day out”

![Prompt: “Remove the thing from her face” ](attachment:ad34fbc8-9e17-4198-b06c-926d8583d517:1370997884060958771_0.webp)

Prompt: “Remove the thing from her face” 

![Prompt: “It's now snowing, everything is covered in snow”](attachment:fd14d83d-fa12-4be2-b755-6b6a1d32631b:1370998863934132318_0.webp)

Prompt: “It's now snowing, everything is covered in snow”

For Character consistency, you can follow this framework to keep the same character across edits: 

1. **Establish the reference**: Begin by clearly identifying your character
    - "This person..." or "The woman with short black hair..."
2. **Specify the transformation**: Clearly state what aspects are changing
    - Environment: "...now in a tropical beach setting"
    - Activity: "...now picking up weeds in a garden"
    - Style: "Transform to Claymation style while keeping the same person"
3. **Preserve identity markers**: Explicitly mention what should remain consistent
    - "...while maintaining the same facial features, hairstyle, and expression"
    - "...keeping the same identity and personality"
    - "...preserving their distinctive appearance"

<aside>
⚠️

**Common mistake**: Using vague references like "her" instead of "The woman with short black hair"

</aside>

## Text Editing

*Kontext* can directly edit text that appears in images, making it easy to update signs, posters, labels, and more without recreating the entire image.

The most effective way to edit text is using quotation marks around the specific text you want to change: 

**Prompt Structure**: `Replace '[original text]' with '[new text]'`

**Example -** We can see below where we have an input image with “Choose joy” written, and we replace “joy” with “BFL” - note the upper case format for BFL. 

![Input image](attachment:e8cea98d-4e99-4824-9f67-7c2a20fd7464:generation-4a34c084-275c-486a-825c-e61fc2936eb1_(1).png)

Input image

![Prompt: *“replace ‘joy’ by ‘BFL’”* ](attachment:5fc3aa7f-f2d1-4197-a2c6-0f43be890e8e:generation-0a4e9286-4dea-4622-ae03-26f989d843bb.png)

Prompt: *“replace ‘joy’ by ‘BFL’”* 

### Text Editing Best Practices

- **Use clear, readable fonts** when possible. Complex or stylized fonts may be harder to edit
- **Specify preservation** when needed. For example: *"Replace 'joy' with 'BFL' while maintaining the same font style and color"*
- **Keep text length similar** - Dramatically longer or shorter text may affect layout

## When Results Don't Match Expectations

**Character identity changes too much**

When transforming a person (changing their clothing, style, or context), it's easy to lose their unique identity features if prompts aren't specific enough.

- Try to be more specific about identity markers ("maintain the exact same face, hairstyle, and distinctive features")
- **Example**: *"Transform the man into a viking warrior while preserving his exact facial features, eye color, and facial expression"*

![Input image](attachment:641f689e-2e2f-4c63-8066-e659c7570669:pexels-creationhill-1681010.jpg)

Input image

![**Prompt: *“**Transform the person into a Viking”*](attachment:c6f8dd2b-ef09-48e7-9e7c-7c07a0393dde:sample.png)

**Prompt: *“**Transform the person into a Viking”*

![**Prompt: *“**Transform the man into a viking warrior while preserving his exact facial features, eye color, and facial expression”*](attachment:55ad6acc-d8b8-4f36-91e7-1f6a8ce4a69a:sample_(1).png)

**Prompt: *“**Transform the man into a viking warrior while preserving his exact facial features, eye color, and facial expression”*

![**Prompt:** *“Change the clothes to be a viking warrior”*](attachment:1394a308-1202-4b86-970f-0c2b9df2c014:sample_(2).png)

**Prompt:** *“Change the clothes to be a viking warrior”*

**Vague prompts replace identity:**

- **Prompt:** *"Transform the person into a Viking"* → Complete replacement of facial features, hair, and expression

**Detailed prompts preserve identity:**

- **Prompt:** *"Transform the man into a viking warrior while preserving his exact facial features, eye color, and facial expression"* → Maintains core identity while changing context

**Focused prompts change only what's needed:**

- **Prompt:** *"Change the clothes to be a viking warrior"* → Keeps perfect identity while only modifying the specified element

**Why this happens?** 

The verb "transform" without qualifiers often signals to *Kontext* that a complete change is desired. It might be useful to use other words for example in this context if you want to maintain specific aspects of the original image.

### Composition Control

When editing backgrounds or scenes, you often want to keep the subject in exactly the same position, scale, and pose. Simple prompts can sometimes change some of those aspects.

**Simple prompts causing unwanted changes:** 

- **Prompt:** *"He's now on a sunny beach"* → Subject position and scale shift
- **Prompt:** *"Put him on a beach"* → Camera angle and framing change

![Input image](attachment:4c556359-e7c4-431e-90c9-4f2c91bc80e1:pexels-thgusstavo-1933873.jpg)

Input image

![Prompt: *"He's now on a sunny beach”*](attachment:5e6102d6-2d1a-4280-bc4b-f1ac975a7efc:generation-fd7836f0-29db-4cea-be63-09528b3b5db9.png)

Prompt: *"He's now on a sunny beach”*

![Prompt: *“Put him on a beach"* ](attachment:3c5cb890-6047-4b06-bce1-0d72935cebd5:87fefb42-03cb-4514-82aa-a26a85016cea.png)

Prompt: *“Put him on a beach"* 

**Precise prompts maintain exact positioning:**

- **Prompt:** *"Change the background to a beach while keeping the person in the exact same position, scale, and pose. Maintain identical subject placement, camera angle, framing, and perspective. Only replace the environment around them"* → Better preservation of subject

![Input image](attachment:4c556359-e7c4-431e-90c9-4f2c91bc80e1:pexels-thgusstavo-1933873.jpg)

Input image

![Prompt: *“Change the background to a beach while keeping the person in the exact same position, scale, and pose. Maintain identical subject placement, camera angle, framing, and perspective. Only replace the environment around them”*](attachment:7f279ec6-e082-4b32-ade4-5864fc7e5682:generation-99b78e9d-914b-4430-afc1-182bea737ee1.png)

Prompt: *“Change the background to a beach while keeping the person in the exact same position, scale, and pose. Maintain identical subject placement, camera angle, framing, and perspective. Only replace the environment around them”*

**Why this happens?** 

Vague instructions like *"put him on a beach"* leave too much to interpretation. *Kontext* might choose to:

- Adjust the framing to match typical beach photos
- Change the camera angle to show more of the beach
- Reposition the subject to better fit the new setting

### **Style isn't applying correctly**

When applying certain styles, simple prompts might create inconsistent results or lose important elements of the original composition. We could see that in the [example above](https://www.notion.so/Kontext-Image-to-Image-1fcc370222d580e2af0df93271590e2b?pvs=21). 

**Basic style prompts can lose important elements:**

- **Prompt:** *"Make it a sketch"* → While the artistic style is applied, some details are lost.

**Precise style prompts maintain structure:**

- **Prompt:** *"Convert to pencil sketch with natural graphite lines, cross-hatching, and visible paper texture"* → Preserves the scene while applying the style. You can see more details in the background, more cars are also appearing on the image.

![Input image](attachment:90a2034f-19fa-4ba2-be21-3b6f0f3697a4:generation-992c7989-3cf6-4743-977b-b2ab4b59d47f.png)

Input image

![**Prompt:** *“Make it a sketch”*](attachment:fbd3c545-cc77-4421-8ca7-b512f3c1553c:sample_(7).png)

**Prompt:** *“Make it a sketch”*

![**Prompt: ***"Convert to pencil sketch with natural graphite lines, cross-hatching, and visible paper texture"*](attachment:f3a99e63-2db6-4e14-8815-c1e9f8777f6e:sample_(8).png)

**Prompt: ***"Convert to pencil sketch with natural graphite lines, cross-hatching, and visible paper texture"*

## Best Practices Summary

- **Be specific**: Precise language gives better results. Use exact color names, detailed descriptions, and clear action verbs instead of vague terms.
- **Start simple**: Begin with core changes before adding complexity. Test basic edits first, then build upon successful results. Kontext can handle very well iterative editing, use it.
- **Preserve intentionally**: Explicitly state what should remain unchanged. Use phrases like *"while maintaining the same [facial features/composition/lighting]"* to protect important elements.
- **Iterate when needed**: Complex transformations often require multiple steps. Break dramatic changes into sequential edits for better control.
- **Name subjects directly**: Use "the woman with short black hair" or "the red car" instead of pronouns like “her”, "it," or "this" for clearer results.
- **Use quotation marks for text**: Quote the exact text you want to change: Replace 'joy' with 'BFL' works better than general text descriptions.
- **Control composition explicitly**: When changing backgrounds or settings, specify *"keep the exact camera angle, position, and framing"* to prevent unwanted repositioning.
- **Choose verbs carefully**: *"Transform"* might imply complete change, while *"change the clothes"* or *"replace the background"* gives you more control over what actually changes.

<aside>
💡

**Remember**: Making things more explicit never hurts if the number of instructions per edit isn't too complicated.

</aside>