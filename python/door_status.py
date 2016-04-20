import RPi.GPIO as GPIO
import time
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False) 
import time
 
door_pin = 23 # change to gpio pin on your setup
 
GPIO.setup(door_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP) # activate input with PullUp

if GPIO.input(door_pin):
    print("1")
else:
    print("0")

