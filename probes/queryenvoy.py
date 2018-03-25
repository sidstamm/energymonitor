#!/usr/bin/python3

#
# Pings an Enphase Envoy and gets current stats.
# NOTE: must be on the same LAN as the envoy.
#

import time;
import requests;

# Extracts info from Enphase Envoy iq

PROD_DATA = requests.get("http://envoy.localdomain/api/v1/production")
CONS_DATA = requests.get("http://envoy.localdomain/api/v1/consumption")

PJ = PROD_DATA.json();
CJ = CONS_DATA.json();

# Generate some useful CSV.

#print("Time,  Prod W now, Cons W now, Prod Wh Today, Cons Wh Today, Prod Wh 7day, Cons Wh 7day, Prod Wh Life, Cons Wh Life")
print(time.asctime(time.localtime()), end=", ")
print("%d, %d, %d, %d, %d, %d, %d, %d"
       % (PJ['wattsNow'],           CJ['wattsNow'],
          PJ['wattHoursToday'],     CJ['wattHoursToday'],
          PJ['wattHoursSevenDays'], CJ['wattHoursSevenDays'],
          PJ['wattHoursLifetime'],  CJ['wattHoursLifetime']))

