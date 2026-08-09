import subprocess
import sys
import os

def main():
    print("Executing Backend API tests to verify E2E flow...")

    # Actually run the test_e2e.py which is now in store_portal/backend

    cmd = ['python3', 'test_e2e.py']
    process = subprocess.Popen(cmd, cwd='store_portal/backend', stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in iter(process.stdout.readline, ''):
        print(line.strip())
    process.wait()
    if process.returncode != 0:
        print("Test failed!")
        sys.exit(1)
    print("Test passed successfully!")

if __name__ == '__main__':
    main()
