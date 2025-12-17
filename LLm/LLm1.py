import unsloth
import torch
from unsloth import FastLanguageModel
from peft import PeftModel

max_seq_length = 2048
dtype = torch.bfloat16
load_in_4bit = True

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/llama-3.1-8b",
    max_seq_length=max_seq_length,
    dtype=dtype,
    load_in_4bit=load_in_4bit,
)

model = PeftModel.from_pretrained(
    model,
    "/content/drive/MyDrive/lora_adapter",
)

FastLanguageModel.for_inference(model)
