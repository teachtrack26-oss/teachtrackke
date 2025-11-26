"""
TeachTrack - All-in-One Startup Script
Starts dev server + ngrok and displays the mobile URL
"""

import subprocess
import requests
import time
import sys
import os
from colorama import init, Fore, Back, Style

# Initialize colorama for Windows
init()

def print_header(text):
    """Print a colored header"""
    print("\n" + "="*70)
    print(f"{Fore.CYAN}{Style.BRIGHT}{text}{Style.RESET_ALL}")
    print("="*70 + "\n")

def print_success(text):
    """Print success message"""
    print(f"{Fore.GREEN}✓ {text}{Style.RESET_ALL}")

def print_error(text):
    """Print error message"""
    print(f"{Fore.RED}✗ {text}{Style.RESET_ALL}")

def print_info(text):
    """Print info message"""
    print(f"{Fore.YELLOW}ℹ {text}{Style.RESET_ALL}")

def wait_for_server(port=3000, timeout=60):
    """Wait for the dev server to be ready"""
    print_info(f"Waiting for dev server on port {port}...")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            requests.get(f'http://localhost:{port}', timeout=1)
            print_success("Dev server is ready!")
            return True
        except:
            print(".", end="", flush=True)
            time.sleep(2)
    
    print()
    print_error("Dev server didn't start in time")
    return False

def get_ngrok_url(max_retries=10):
    """Get the ngrok public URL"""
    print_info("Fetching ngrok URL...")
    
    for i in range(max_retries):
        try:
            response = requests.get('http://127.0.0.1:4040/api/tunnels', timeout=2)
            data = response.json()
            
            if data.get('tunnels') and len(data['tunnels']) > 0:
                return data['tunnels'][0].get('public_url', '')
        except:
            pass
        
        print(".", end="", flush=True)
        time.sleep(1)
    
    print()
    return None

def main():
    os.system('cls' if os.name == 'nt' else 'clear')
    
    print_header("🚀 TeachTrack - Starting All Services")
    
    # Step 1: Start dev server
    print(f"{Fore.CYAN}[1/3]{Style.RESET_ALL} Starting development server...")
    dev_process = subprocess.Popen(
        'npm run dev:all',
        shell=True,
        cwd=os.path.dirname(os.path.abspath(__file__)),
        creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
    )
    print_success("Dev server process started (running in separate window)")
    
    # Step 2: Wait for server to be ready
    print(f"\n{Fore.CYAN}[2/3]{Style.RESET_ALL} Waiting for server to initialize...")
    if not wait_for_server():
        print_error("Failed to start dev server")
        sys.exit(1)
    
    # Step 3: Start ngrok
    print(f"\n{Fore.CYAN}[3/3]{Style.RESET_ALL} Starting ngrok tunnel...")
    ngrok_process = subprocess.Popen(
        [r'C:\Users\MKT\Desktop\ngrok.exe', 'http', '3000'],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    print_success("Ngrok process started")
    
    # Step 4: Get ngrok URL
    print()
    time.sleep(3)  # Give ngrok a moment to connect
    url = get_ngrok_url()
    
    # Display results
    print()
    print("="*70)
    print(f"{Back.GREEN}{Fore.BLACK}{Style.BRIGHT} ✓ ALL SERVICES RUNNING! {Style.RESET_ALL}")
    print("="*70)
    print()
    
    if url:
        print(f"{Fore.CYAN}{Style.BRIGHT}📱 MOBILE ACCESS URL:{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{Style.BRIGHT}   {url}{Style.RESET_ALL}")
        print()
    else:
        print_error("Could not fetch ngrok URL automatically")
        print_info("Visit http://127.0.0.1:4040 to see the URL")
        print()
    
    print(f"{Fore.CYAN}{Style.BRIGHT}💻 LOCAL ACCESS:{Style.RESET_ALL}")
    print(f"   http://localhost:3000")
    print()
    
    print(f"{Fore.CYAN}{Style.BRIGHT}🔧 NGROK DASHBOARD:{Style.RESET_ALL}")
    print(f"   http://127.0.0.1:4040")
    print()
    
    print("="*70)
    print()
    print(f"{Fore.YELLOW}📌 Instructions for Mobile Access:{Style.RESET_ALL}")
    print(f"   1. Open the Mobile Access URL on your phone")
    print(f"   2. Click 'Visit Site' on the ngrok warning page")
    print(f"   3. Login with your TeachTrack credentials")
    print()
    print(f"{Fore.RED}⚠️  To stop all services:{Style.RESET_ALL}")
    print(f"   Press Ctrl+C here or close the terminal windows")
    print()
    print("="*70)
    print()
    
    try:
        # Keep script running
        print(f"{Fore.CYAN}Press Ctrl+C to stop all services...{Style.RESET_ALL}\n")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n")
        print_info("Shutting down services...")
        ngrok_process.terminate()
        dev_process.terminate()
        print_success("All services stopped")
        print()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print_error(f"Error: {e}")
        sys.exit(1)
