import requests

# Test the ML backend endpoint
url = "http://localhost:8000/api/candidates"
params = {
    "limit": 50,
    "large_cap_count": 5,
    "mid_cap_count": 5,
    "small_cap_count": 5,
    "sector": "Technology"
}

try:
    response = requests.get(url, params=params)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Count: {data['count']}")
        print(f"Categories: {data['categories']}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")

# Test without sector
print("\n--- Without sector filter ---")
params2 = {
    "limit": 50,
    "large_cap_count": 5,
    "mid_cap_count": 5,
    "small_cap_count": 5
}

try:
    response = requests.get(url, params=params2)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Count: {data['count']}")
        print(f"Categories: {data['categories']}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
