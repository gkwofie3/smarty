import requests
import sys

BASE_URL = "http://localhost:8000/api/script/programs/1/"

def test_validation():
    # 1. Update code with syntax error
    print("Updating code with syntax error...")
    patch_res = requests.patch(BASE_URL + "update_code/", json={"code_text": "digital_input x;\nx = 1\nif:"}, headers={"Accept": "application/json"})
    print(f"Patch Status: {patch_res.status_code}")
    print(f"Patch Response: {patch_res.text}")

    # 2. Validate
    print("\nValidating...")
    val_res = requests.post(BASE_URL + "validate/")
    print(f"Validation Status: {val_res.status_code}")
    print(f"Validation Response: {val_res.text}")

if __name__ == "__main__":
    try:
        test_validation()
    except Exception as e:
        print(f"Error connecting: {e}")
