from flask import current_app
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

class ModelService:
    def __init__(self):
        self.model_name = current_app.config['MODEL_NAME']
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForCausalLM.from_pretrained(self.model_name)

    def generate_response(self, prompt, max_length=150):
        inputs = self.tokenizer.encode(prompt, return_tensors='pt')
        outputs = self.model.generate(inputs, max_length=max_length, num_return_sequences=1)
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response

    def generate_multimodal_response(self, prompt, max_length=150):
        # Placeholder for multimodal response generation logic
        text_response = self.generate_response(prompt, max_length)
        # Additional logic for generating images or charts can be added here
        return {
            'text': text_response,
            'image': None,  # Replace with actual image generation logic
            'chart': None   # Replace with actual chart generation logic
        }