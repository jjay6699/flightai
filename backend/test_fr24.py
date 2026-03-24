import requests
import json

def get_flights(origin, dest):
    # Example: getting flights from JFK to LHR
    # Flightradar24 doesn't have a simple origin-dest schedule API without scraping, 
    # but let's check what their airport arrivals/departures endpoint returns.
    url = f"https://api.flightradar24.com/common/v1/airport.json?code={origin}&plugin[]=&plugin-setting[schedule][mode]=departures&plugin-setting[schedule][timestamp]=&page=1&limit=100"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        departures = data.get('result', {}).get('response', {}).get('airport', {}).get('pluginData', {}).get('schedule', {}).get('departures', {}).get('data', [])
        
        flights_to_dest = []
        for flight in departures:
            flight_info = flight.get('flight', {})
            arr_airport = flight_info.get('airport', {}).get('destination', {}).get('code', {}).get('iata')
            
            if arr_airport and arr_airport.upper() == dest.upper():
                flights_to_dest.append({
                    'flightNumber': flight_info.get('identification', {}).get('number', {}).get('default'),
                    'airline': flight_info.get('airline', {}).get('name'),
                    'airlineCode': flight_info.get('airline', {}).get('code', {}).get('iata'),
                    'departureTime': flight_info.get('time', {}).get('scheduled', {}).get('departure'),
                    'arrivalTime': flight_info.get('time', {}).get('scheduled', {}).get('arrival'),
                    'duration': flight_info.get('track', {}).get('duration') # Might not be here, we can calculate
                })
        
        print(json.dumps(flights_to_dest[:2], indent=2))
    else:
        print("Failed:", response.status_code)

get_flights('JFK', 'LHR')
