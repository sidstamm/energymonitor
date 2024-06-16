#!/usr/bin/python3

#
# Pings an Enphase Envoy and gets current stats.
# NOTE: must be on the same LAN as the envoy.
#

import os
import sqlite3
import time
import requests
import sys
import datetime

from urllib3.exceptions import InsecureRequestWarning

# Suppress the warnings from urllib3
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

# Extracts info from Enphase Envoy iq
# Puts data into sqlite3 db specified by command line argument argv[1]

PROD_DATA = requests.get("http://envoy.localdomain/api/v1/production", verify=False)
CONS_DATA = requests.get("http://envoy.localdomain/api/v1/consumption", verify=False)

PJ = PROD_DATA.json();
CJ = CONS_DATA.json();

DATABASE_FILEPATH=sys.argv[1]

# Connect to DB and insert the stuff.
if not os.path.isfile(DATABASE_FILEPATH):
    print("ERROR: database is not a file or does not exist, %s" % (DATABASE_FILEPATH))
    sys.exit(1)

try:
    with sqlite3.connect(DATABASE_FILEPATH) as conn:
        c = conn.cursor()
        # Get the timestamp, date and time
        dt = datetime.datetime.now()

        # import it
        c.execute('INSERT INTO envoy VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                  (int(dt.timestamp()),
                   dt.strftime("%d-%m-%Y"),
                   dt.strftime("%H:%M:%S"),
                   PJ['wattsNow'],           CJ['wattsNow'],
                   PJ['wattHoursToday'],     CJ['wattHoursToday'],
                   PJ['wattHoursSevenDays'], CJ['wattHoursSevenDays'],
                   PJ['wattHoursLifetime'],  CJ['wattHoursLifetime'])
                  )

except Exception as e:
    print("ERROR Writing to database:")
    print(str(e))
    sys.exit(1)


