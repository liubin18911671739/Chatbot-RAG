# backend/utils/helpers.py

def validate_json(data, required_fields):
    """Validate JSON data against required fields."""
    if not isinstance(data, dict):
        return False
    return all(field in data for field in required_fields)

def format_response(status, message, data=None):
    """Format the response for API endpoints."""
    response = {
        "status": status,
        "message": message
    }
    if data is not None:
        response["data"] = data
    return response

def log_error(error_message):
    """Log error messages for debugging."""
    # Here you can implement logging to a file or monitoring system
    print(f"Error: {error_message}")  # Replace with proper logging in production

def extract_prompt(data):
    """Extract prompt from incoming JSON data."""
    return data.get("prompt", "")