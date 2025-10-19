# Deploy to Hugging Face Spaces

## What is this?

This is a FREE backend for vitamin ingredient extraction.

## Features

- FREE OCR-based ingredient extraction
- No API keys required
- Works 24/7
- No cold starts

## API Endpoints

- `GET /health` - Health check
- `POST /analyze` - Analyze vitamin label image

## How to Use

Send POST request to `/analyze` with:

```json
{
  "image": "base64_encoded_image_data"
}
```

Returns:

```json
{
  "success": true,
  "productName": "Prenatal Multivitamin",
  "ingredients": [
    {"name": "Vitamin A", "amount": "770", "unit": "mcg"}
  ]
}
```

## Accuracy

- OCR-based extraction: 70-80% accuracy
- Works best with clear, well-lit vitamin labels
- Focuses on supplement facts panels

## License

MIT License - Free to use!

